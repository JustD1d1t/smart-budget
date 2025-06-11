import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
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

export default function EditExpensePage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useUserStore();
    const { updateExpense } = useExpensesStore();

    const [amount, setAmount] = useState(0);
    const [store, setStore] = useState("");
    const [date, setDate] = useState("");
    const [category, setCategory] = useState("");
    const [sharedWith, setSharedWith] = useState<Member[]>([]);
    const [toast, setToast] = useState<{ message: string; type?: "error" | "success" } | null>(null);
    const { expenses } = useExpensesStore();

    useEffect(() => {
        if (!id) return;
        const expense = expenses.find((e) => e.id === id);
        if (!expense) {
            setToast({ message: "Nie znaleziono wydatku.", type: "error" });
            return;
        }

        setAmount(expense.amount);
        setStore(expense.store);
        setDate(expense.date);
        setCategory(expense.category || "");
    }, [id, expenses]);

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

    const handleRemove = (id: string) => {
        setSharedWith((prev) => prev.filter((m) => m.id !== id));
    };

    const handleSave = async () => {
        if (!id || !user?.id || !store.trim() || !amount || !date || !category) return;

        const result = await updateExpense(
            id,
            user.id,
            {
                amount,
                store: store.trim(),
                date,
                category,
            },
            sharedWith
        );

        if (!result.success) {
            setToast({ message: result.error || "Błąd zapisu zmian.", type: "error" });
            return;
        }

        navigate("/expenses");
    };

    return (
        <div className="p-4 max-w-xl mx-auto space-y-4">
            <h1 className="text-2xl font-bold">✏️ Edytuj wydatek</h1>

            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            <MemberList
                isOwner={true}
                members={sharedWith}
                onInvite={handleInvite}
                onRemove={handleRemove}
            />

            <Input
                type="number"
                placeholder="Kwota (zł)"
                value={amount.toString()}
                onChange={(e) => setAmount(Number(e.target.value))}
            />

            <Input
                placeholder="Sklep"
                value={store}
                onChange={(e) => setStore(e.target.value)}
            />

            <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
            />

            <Select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                options={CATEGORIES}
                placeholder="-- wybierz kategorię --"
            />

            <Button onClick={handleSave}>💾 Zapisz zmiany</Button>
        </div>
    );
}
