import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ReceiptField from "../../components/receipts/ReceiptField";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import MemberList from "../../components/ui/MemberList";
import Select from "../../components/ui/Select";
import Toast from "../../components/ui/Toast";
import { supabase } from "../../lib/supabaseClient";
import { Member, useExpensesStore } from "../../stores/expensesStore";
import { useUserStore } from "../../stores/userStore";
import { CATEGORIES } from "../../utils/categories";

type ExistingReceiptState = {
    path: string;
    url: string;
    name: string;
    mime?: string | null;
};

const SUPPORTED_EXT = /\.(png|jpe?g|webp|gif)$/i;

export default function EditExpensePage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useUserStore();
    const { updateExpense, expenses } = useExpensesStore();

    const [amount, setAmount] = useState(0);
    const [store, setStore] = useState("");
    const [date, setDate] = useState("");
    const [category, setCategory] = useState("");
    const [description, setDescription] = useState("");

    const [sharedWith, setSharedWith] = useState<Member[]>([]);
    const [toast, setToast] = useState<{ message: string; type?: "error" | "success" } | null>(null);

    // JEDEN zapisany paragon (jeśli istnieje)
    const [existingReceipt, setExistingReceipt] = useState<ExistingReceiptState | null>(null);
    const [loadingReceipt, setLoadingReceipt] = useState(false);

    // JEDEN nowy plik (kontrolowany przez stronę)
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);

    // Wczytanie podstawowych danych wydatku + viewers
    useEffect(() => {
        if (!id) return;
        const found = expenses.find((e) => e.id === id && e.user_id === user?.id);
        if (!found) return;

        setAmount(found.amount);
        setStore(found.store);
        setDate(found.date);
        setCategory(found.category || "");
        setDescription((found as any).description ?? "");

        const fetchViewers = async () => {
            const { data: viewers } = await supabase
                .from("expense_viewers")
                .select("user_id")
                .eq("expense_id", id);

            const viewerIds = viewers?.map((v) => v.user_id) || [];
            if (viewerIds.length > 0) {
                const { data: users } = await supabase
                    .from("profiles")
                    .select("id, email")
                    .in("id", viewerIds);
                if (users) {
                    setSharedWith(users.map((u) => ({ id: u.id, email: u.email, role: "viewer" })));
                }
            }
        };
        fetchViewers();
    }, [id, expenses, user?.id]);

    // Wczytaj najnowszy zapisany paragon (z podpisanym URL)
    useEffect(() => {
        const loadReceipt = async () => {
            if (!id || !user?.id) return;
            setLoadingReceipt(true);
            try {
                const folder = `${user.id}/${id}`;
                const { data: list, error } = await supabase.storage
                    .from("receipts")
                    .list(folder, { limit: 1000 });
                if (error) {
                    console.warn("[STORAGE] list error:", error);
                    setExistingReceipt(null);
                    return;
                }
                if (!list || list.length === 0) {
                    setExistingReceipt(null);
                    return;
                }

                // Wybierz najnowszy wg created_at (jeśli brak, sort po name)
                const sorted = [...list].sort((a: any, b: any) => {
                    const da = a.created_at ? new Date(a.created_at).getTime() : 0;
                    const db = b.created_at ? new Date(b.created_at).getTime() : 0;
                    if (db !== da) return db - da;
                    return String(b.name).localeCompare(String(a.name));
                });

                const first = sorted[0];
                const fullPath = `${folder}/${first.name}`;
                const { data: signed, error: sErr } = await supabase.storage
                    .from("receipts")
                    .createSignedUrl(fullPath, 60 * 5);
                if (sErr) {
                    console.warn("[STORAGE] signed url error:", sErr);
                    setExistingReceipt(null);
                    return;
                }

                setExistingReceipt({
                    path: fullPath,
                    url: signed!.signedUrl,
                    name: first.name,
                    mime: (first as any)?.metadata?.mimetype ?? null,
                });
            } finally {
                setLoadingReceipt(false);
            }
        };
        loadReceipt();
    }, [id, user?.id]);

    const handleInvite = async (email: string) => {
        const alreadyAdded = sharedWith.some((m) => m.email === email);
        if (alreadyAdded) {
            setToast({ message: "Użytkownik już dodany.", type: "error" });
            return;
        }
        const { data: userData, error } = await supabase
            .from("profiles")
            .select("id, email")
            .eq("email", email)
            .maybeSingle();
        if (!userData || error) {
            setToast({ message: "Nie znaleziono użytkownika.", type: "error" });
            return;
        }
        setSharedWith((prev) => [...prev, { id: userData.id, email: userData.email, role: "viewer" }]);
    };

    const handleRemove = (idUser: string) => {
        setSharedWith((prev) => prev.filter((m) => m.id !== idUser));
    };

    const randomName = (ext: string) => {
        const base =
            typeof crypto !== "undefined" && "randomUUID" in crypto
                ? (crypto as any).randomUUID()
                : Math.random().toString(36).slice(2);
        return `${base}.${ext}`;
    };

    const deleteExistingReceipt = async () => {
        if (!existingReceipt) return;
        const { error } = await supabase.storage.from("receipts").remove([existingReceipt.path]);
        if (error) {
            setToast({ message: "Nie udało się usunąć paragonu.", type: "error" });
            return;
        }
        await supabase.from("expenses").update({ receipt_path: null, receipt_mime: null }).eq("id", id);
        setExistingReceipt(null);
        setToast({ message: "Paragon usunięty.", type: "success" });
    };

    const handleSave = async () => {
        if (!id || !user?.id || !store.trim() || !amount || !date || !category) return;

        setUploading(true);
        try {
            // 1) zaktualizuj dane (w tym opis)
            const result = await updateExpense(
                id,
                user.id,
                {
                    amount,
                    store: store.trim(),
                    date,
                    category,
                    description: description.trim() || null,
                } as any,
                sharedWith
            );
            if (!result.success) {
                setToast({ message: result.error || "Błąd zapisu zmian.", type: "error" });
                setUploading(false);
                return;
            }

            // 2) upload nowego pliku (jeśli wybrany) – jeden obraz
            if (file) {
                const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
                if (!SUPPORTED_EXT.test("." + ext)) {
                    setToast({ message: "Nieobsługiwany format obrazu.", type: "error" });
                } else {
                    // Usuń stary, jeśli był
                    if (existingReceipt) {
                        await supabase.storage.from("receipts").remove([existingReceipt.path]);
                    }

                    const name = randomName(ext);
                    const path = `${user.id}/${id}/${name}`;
                    const { error: upErr } = await supabase.storage
                        .from("receipts")
                        .upload(path, file, { upsert: false, contentType: file.type || "image/jpeg" });

                    if (upErr) {
                        setToast({ message: "Nie udało się wgrać nowego paragonu.", type: "error" });
                    } else {
                        // zaktualizuj wskaźnik w expenses
                        await supabase
                            .from("expenses")
                            .update({ receipt_path: path, receipt_mime: file.type || null })
                            .eq("id", id);

                        // odśwież podgląd
                        const { data: signed } = await supabase.storage
                            .from("receipts")
                            .createSignedUrl(path, 60 * 5);
                        setExistingReceipt({
                            path,
                            url: signed?.signedUrl || "",
                            name,
                            mime: file.type || null,
                        });
                        setFile(null);
                    }
                }
            }

            setToast({ message: "Zapisano zmiany.", type: "success" });
        } catch (e: any) {
            console.error(e);
            setToast({ message: e?.message || "Błąd zapisu.", type: "error" });
        } finally {
            setUploading(false);
        }
    };

    const canSave = useMemo(
        () => !!id && !!user?.id && !!store.trim() && !!amount && !!date && !!category,
        [id, user?.id, store, amount, date, category]
    );

    return (
        <div className="p-4 max-w-xl mx-auto space-y-4">
            <h1 className="text-2xl font-bold">✏️ Edytuj wydatek</h1>

            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            <MemberList isOwner={true} members={sharedWith} onInvite={handleInvite} onRemove={handleRemove} />

            <Input
                type="number"
                placeholder="Kwota (zł)"
                value={amount.toString()}
                onChange={(e) => setAmount(Number(e.target.value))}
            />

            <Input placeholder="Sklep" value={store} onChange={(e) => setStore(e.target.value)} />

            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />

            <Select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                options={CATEGORIES}
                placeholder="-- wybierz kategorię --"
            />

            {/* Opis – opcjonalny */}
            <textarea
                placeholder="Opis (opcjonalnie)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-md border px-3 py-2 text-sm"
                rows={3}
            />

            {/* Wspólny komponent (1 plik, preview + lightbox, kasowanie istniejącego) */}
            <ReceiptField
                label={existingReceipt ? "Podmień paragon" : "Dodaj paragon"}
                existing={
                    loadingReceipt || !existingReceipt
                        ? null
                        : { url: existingReceipt.url, name: existingReceipt.name }
                }
                onDeleteExisting={existingReceipt ? deleteExistingReceipt : undefined}
                file={file}
                onFileChange={setFile}
                onError={(msg) => setToast({ message: msg, type: "error" })}
            />

            <div className="flex gap-2">
                <Button onClick={() => navigate(-1)} variant="ghost">
                    ← Wróć
                </Button>
                <Button onClick={handleSave} disabled={!canSave || uploading}>
                    {uploading ? "Zapisywanie…" : "💾 Zapisz zmiany"}
                </Button>
            </div>
        </div>
    );
}
