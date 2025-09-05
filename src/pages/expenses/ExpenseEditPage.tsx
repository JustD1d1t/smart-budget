import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import MemberList from "../../components/ui/MemberList";
import Select from "../../components/ui/Select";
import Toast from "../../components/ui/Toast";
import { supabase } from "../../lib/supabaseClient";
import { Member, useExpensesStore } from "../../stores/expensesStore";
import { useUserStore } from "../../stores/userStore";
import { CATEGORIES } from "../../utils/categories";

type StoredReceipt = {
    path: string;
    url: string;
    name: string;
    mime?: string | null;
};

const SUPPORTED_EXT = /\.(png|jpe?g|webp|gif)$/i;
const ACCEPT_ATTR = "image/png,image/jpeg,image/jpg,image/webp,image/gif";

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
    const [existingReceipt, setExistingReceipt] = useState<StoredReceipt | null>(null);
    const [loadingReceipt, setLoadingReceipt] = useState(false);

    // JEDEN nowy plik
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);

    // Lightbox
    const [lightbox, setLightbox] = useState<{ src: string; alt: string } | null>(null);
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => e.key === "Escape" && setLightbox(null);
        if (lightbox) document.addEventListener("keydown", onKey);
        return () => document.removeEventListener("keydown", onKey);
    }, [lightbox]);

    useEffect(() => {
        if (!file) {
            setPreview(null);
            return;
        }
        const url = URL.createObjectURL(file);
        setPreview(url);
        return () => URL.revokeObjectURL(url);
    }, [file]);

    // wczytanie podstawowych danych
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

    // wczytaj jeden zapisany paragon (jeśli jest) – bierzemy najnowszy z listy
    useEffect(() => {
        const loadReceipt = async () => {
            if (!id || !user?.id) return;
            setLoadingReceipt(true);
            try {
                const folder = `${user.id}/${id}`;
                const { data: list, error } = await supabase.storage
                    .from("receipts")
                    .list(folder, { limit: 100, sortBy: { column: "updated_at", order: "desc" } as any });
                if (error) {
                    console.warn("[STORAGE] list error:", error);
                    setExistingReceipt(null);
                    return;
                }
                const first = (list ?? [])[0];
                if (!first) {
                    setExistingReceipt(null);
                    return;
                }
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
        // wyczyść wskaźnik w expenses (opcjonalne kolumny)
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

            // 2) jeśli wybrano NOWY plik → ewentualnie usuń stary i wgraj nowy (tylko obraz)
            if (file) {
                const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
                if (!SUPPORTED_EXT.test("." + ext)) {
                    setToast({ message: "Nieobsługiwany format obrazu.", type: "error" });
                } else {
                    // usuń istniejący paragon (jeśli był)
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
                        // ustaw wskaźnik w expenses (opcjonalne kolumny)
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

            {/* Zapisany paragon (jeden) */}
            <section className="space-y-2">
                <div className="text-sm font-medium">Zapisany paragon</div>
                {loadingReceipt ? (
                    <div className="text-sm text-gray-500">Ładowanie…</div>
                ) : !existingReceipt ? (
                    <div className="text-sm text-gray-500">Brak zapisanego paragonu.</div>
                ) : (
                    <div className="relative rounded-md border p-1 w-full max-w-xs">
                        <img
                            src={existingReceipt.url}
                            alt="Paragon"
                            className="h-28 w-full object-cover rounded cursor-zoom-in"
                            onClick={() => setLightbox({ src: existingReceipt.url, alt: "Paragon" })}
                            onError={() => setExistingReceipt((prev) => (prev ? { ...prev, url: "" } : prev))}
                        />
                        <div className="mt-1 flex items-center justify-between gap-2">
                            <div className="text-xs text-gray-700 truncate">{existingReceipt.name}</div>
                            <button
                                type="button"
                                className="text-xs underline"
                                onClick={deleteExistingReceipt}
                                title="Usuń paragon"
                            >
                                Usuń
                            </button>
                        </div>
                        <span className="absolute left-1.5 top-1.5 rounded bg-white/80 px-1.5 py-0.5 text-xs border">
                            zapisany
                        </span>
                    </div>
                )}
            </section>

            {/* Podmień / dodaj nowy (jeden plik) */}
            <section className="space-y-3">
                <div className="text-sm font-medium">
                    {existingReceipt ? "Podmień paragon (jeden obraz)" : "Dodaj paragon (jeden obraz)"}
                </div>
                <input
                    type="file"
                    accept={ACCEPT_ATTR}
                    onChange={(e) => {
                        const f = e.target.files?.[0] || null;
                        if (!f) {
                            setFile(null);
                            return;
                        }
                        const ext = (f.name.split(".").pop() || "").toLowerCase();
                        if (!SUPPORTED_EXT.test("." + ext)) {
                            setToast({ message: "Nieobsługiwany format obrazu.", type: "error" });
                            setFile(null);
                            return;
                        }
                        setFile(f);
                    }}
                    className="w-full rounded-md border px-3 py-2 text-sm"
                />

                {preview && (
                    <div className="relative w-full max-w-xs">
                        <img
                            src={preview}
                            alt="Podgląd nowego paragonu"
                            className="h-28 w-full object-cover rounded-md border cursor-zoom-in"
                            onClick={() => setLightbox({ src: preview, alt: "Podgląd nowego paragonu" })}
                        />
                        <button
                            type="button"
                            onClick={() => setFile(null)}
                            className="absolute -top-2 -right-2 rounded-full bg-white/90 border shadow px-2 py-1 text-xs hover:bg-white"
                            aria-label="Usuń załącznik"
                            title="Usuń"
                        >
                            ✕
                        </button>
                        <div className="mt-1 text-xs text-gray-600 truncate">{file?.name}</div>
                    </div>
                )}
            </section>

            <div className="flex gap-2">
                <Button onClick={() => navigate(-1)} variant="ghost">
                    ← Wróć
                </Button>
                <Button onClick={handleSave} disabled={!canSave || uploading}>
                    {uploading ? "Zapisywanie…" : "💾 Zapisz zmiany"}
                </Button>
            </div>

            {/* LIGHTBOX overlay (max-width 640px) */}
            {lightbox && (
                <div
                    className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
                    role="dialog"
                    aria-modal="true"
                    onClick={() => setLightbox(null)}
                >
                    <div className="relative" onClick={(e) => e.stopPropagation()}>
                        <img
                            src={lightbox.src}
                            alt={lightbox.alt}
                            className="w-full max-w-[640px] rounded-lg shadow-xl object-contain"
                        />
                        <button
                            type="button"
                            aria-label="Zamknij"
                            title="Zamknij"
                            onClick={() => setLightbox(null)}
                            className="absolute -top-3 -right-3 h-8 w-8 rounded-full bg-white text-black shadow grid place-items-center"
                        >
                            ✕
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
