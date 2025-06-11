import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import MemberList from "../../components/ui/MemberList";
import Select from "../../components/ui/Select";
import Toast from "../../components/ui/Toast";
import { supabase } from "../../lib/supabaseClient";
import { useExpensesStore } from "../../stores/expensesStore";
import { useUserStore } from "../../stores/userStore";

const CATEGORIES = ["żywność", "samochód", "rozrywka", "chemia", "inne"];

interface Member {
    id: string;
    email: string;
    role: string;
}

export default function ExpensesNewPage() {
    const { user } = useUserStore();
    const { addExpense } = useExpensesStore();
    const navigate = useNavigate();

    const [amount, setAmount] = useState(0);
    const [store, setStore] = useState("");
    const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
    const [category, setCategory] = useState("");
    const [sharedWith, setSharedWith] = useState<Member[]>([]);

    const [amountError, setAmountError] = useState("");
    const [storeError, setStoreError] = useState("");
    const [dateError, setDateError] = useState("");
    const [categoryError, setCategoryError] = useState("");
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

        const updated = [...sharedWith, { id: profile.id, email: profile.email, role: "viewer" }];
        setSharedWith(updated);
    };

    const handleRemoveFromThisExpense = (id: string) => {
        setSharedWith((prev) => prev.filter((m) => m.id !== id));
    };

    const validateForm = () => {
        let isValid = true;

        if (!amount || amount <= 0) {
            setAmountError("Kwota musi być większa od zera.");
            isValid = false;
        } else {
            setAmountError("");
        }

        if (!store.trim()) {
            setStoreError("Sklep nie może być pusty.");
            isValid = false;
        } else {
            setStoreError("");
        }

        const selectedDate = new Date(date);
        const today = new Date();
        today.setHours(23, 59, 59, 999);
        if (selectedDate > today) {
            setDateError("Data nie może być z przyszłości.");
            isValid = false;
        } else {
            setDateError("");
        }

        if (!category) {
            setCategoryError("Wybierz kategorię.");
            isValid = false;
        } else {
            setCategoryError("");
        }

        return isValid;
    };

    const handleAdd = async () => {
        if (!validateForm() || !user?.id) return;

        const result = await addExpense(
            {
                amount,
                store: store.trim(),
                date,
                category,
                user_id: user.id,
            },
            sharedWith
        );

        if (!result.success) {
            setToast({ message: result.error || "Błąd dodania wydatku.", type: "error" });
            return;
        }

        setToast({ message: "Wydatek dodany!", type: "success" });
        setTimeout(() => navigate("/expenses"), 500);
    };

    return (
        <div className="p-4 max-w-2xl mx-auto space-y-4">
            <h2 className="text-xl font-bold">💸 Nowy wydatek</h2>

            {toast && (
                <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
            )}

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

            <Button onClick={handleAdd}>➕ Dodaj wydatek</Button>
        </div>
    );
}
