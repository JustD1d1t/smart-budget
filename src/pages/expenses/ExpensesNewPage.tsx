import { useState } from "react";
import { useNavigate } from "react-router-dom";
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

export default function ExpensesNewPage() {
    const { user } = useUserStore();
    const { addExpense } = useExpensesStore();
    const navigate = useNavigate();

    const [amount, setAmount] = useState(0);
    const [store, setStore] = useState("");
    const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
    const [category, setCategory] = useState("");
    const [description, setDescription] = useState("");
    const [sharedWith, setSharedWith] = useState<Member[]>([]);

    // jeden plik paragonu – kontrolowany przez stronę
    const [file, setFile] = useState<File | null>(null);

    const [amountError, setAmountError] = useState("");
    const [storeError, setStoreError] = useState("");
    const [dateError, setDateError] = useState("");
    const [categoryError, setCategoryError] = useState("");
    const [uploading, setUploading] = useState(false);
    const [toast, setToast] = useState<{ message: string; type?: "error" | "success" } | null>(null);

    const handleInviteToThisExpense = async (email: string) => {
        const alreadyAdded = sharedWith.some((m) => m.email === email);
        if (alreadyAdded) {
            setToast({ message: "Użytkownik już dodany do tego wydatku.", type: "error" });
            return;
        }

        const { data: profile, error } = await supabase
            .from("profiles")
            .select("id, email")
            .eq("email", email)
            .maybeSingle();

        if (!profile || error) {
            setToast({ message: "Nie znaleziono użytkownika.", type: "error" });
            return;
        }

        setSharedWith((prev) => [...prev, { id: profile.id, email: profile.email, role: "viewer" }]);
    };

    const handleRemoveFromThisExpense = (id: string) => {
        setSharedWith((prev) => prev.filter((m) => m.id !== id));
    };

    const validateForm = () => {
        let isValid = true;

        if (!amount || amount <= 0) {
            setAmountError("Kwota musi być większa od zera.");
            isValid = false;
        } else setAmountError("");

        if (!store.trim()) {
            setStoreError("Sklep nie może być pusty.");
            isValid = false;
        } else setStoreError("");

        const selectedDate = new Date(date);
        const today = new Date();
        today.setHours(23, 59, 59, 999);
        if (selectedDate > today) {
            setDateError("Data nie może być z przyszłości.");
            isValid = false;
        } else setDateError("");

        if (!category) {
            setCategoryError("Wybierz kategorię.");
            isValid = false;
        } else setCategoryError("");

        // Limit np. 10 MB na 1 obraz (komponent ReceiptField waliduje rozszerzenia)
        if (file && file.size > 10 * 1024 * 1024) {
            setToast({ message: "Plik paragonu > 10 MB.", type: "error" });
            isValid = false;
        }

        return isValid;
    };

    const randomName = (ext: string) => {
        const base =
            typeof crypto !== "undefined" && "randomUUID" in crypto
                ? (crypto as any).randomUUID()
                : Math.random().toString(36).slice(2);
        return `${base}.${ext}`;
    };

    const handleAdd = async () => {
        if (!validateForm() || !user?.id) return;

        setUploading(true);
        try {
            // 1) utwórz wydatek
            const result: any = await addExpense(
                {
                    amount,
                    store: store.trim(),
                    date,
                    category,
                    description: description.trim() || null,
                    user_id: user.id,
                },
                sharedWith
            );

            if (!result?.success || !result?.data?.id) {
                setToast({ message: result?.error || "Błąd zapisu wydatku.", type: "error" });
                return;
            }

            const expenseId: string = result.data.id;

            // 2) jeśli jest plik → upload (jeden)
            if (file) {
                const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
                const name = randomName(ext);
                const path = `${user.id}/${expenseId}/${name}`;

                const { error: upErr } = await supabase.storage
                    .from("receipts")
                    .upload(path, file, {
                        upsert: false,
                        contentType: file.type || "image/jpeg",
                    });

                if (upErr) {
                    setToast({ message: "Wydatek zapisany, ale nie udało się wgrać paragonu.", type: "error" });
                } else {
                    // zapisz ścieżkę w expenses (opcjonalne kolumny)
                    await supabase
                        .from("expenses")
                        .update({ receipt_path: path, receipt_mime: file.type || null })
                        .eq("id", expenseId);
                }
            }

            setToast({ message: "Wydatek dodany!", type: "success" });
            setTimeout(() => navigate("/expenses"), 500);
        } catch (e: any) {
            console.error(e);
            setToast({ message: e?.message || "Błąd dodawania wydatku.", type: "error" });
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="p-4 max-w-2xl mx-auto space-y-4">
            <h2 className="text-xl font-bold">💸 Nowy wydatek</h2>

            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            <MemberList
                isOwner={true}
                members={sharedWith}
                onInvite={handleInviteToThisExpense}
                onRemove={handleRemoveFromThisExpense}
            />

            <Input
                type="number"
                placeholder="Kwota (zł)"
                value={amount.toString()}
                onChange={(e) => setAmount(Number(e.target.value))}
                error={amountError}
            />

            <Input
                placeholder="Sklep"
                value={store}
                onChange={(e) => setStore(e.target.value)}
                error={storeError}
            />

            <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                error={dateError}
            />

            <Select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                options={CATEGORIES}
                placeholder="-- wybierz kategorię --"
                error={categoryError}
            />

            {/* Opis – opcjonalny */}
            <textarea
                placeholder="Opis (opcjonalnie)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-md border px-3 py-2 text-sm"
                rows={3}
            />

            <ReceiptField
                label="Paragon (jeden obraz)"
                existing={null}
                file={file}
                onFileChange={setFile}
                onError={(msg) => setToast({ message: msg, type: "error" })}
            />

            <Button onClick={handleAdd} disabled={uploading}>
                {uploading ? "Wysyłanie..." : "➕ Dodaj wydatek"}
            </Button>
        </div>
    );
}
