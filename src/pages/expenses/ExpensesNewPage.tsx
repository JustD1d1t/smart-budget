import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Select from "../../components/ui/Select";
import { supabase } from "../../lib/supabaseClient";
import { useUserStore } from "../../stores/userStore";

export type Expense = {
    amount: number;
    store: string;
    date: string; // ISO string
    category: string;
};

const CATEGORIES = ["żywność", "samochód", "rozrywka", "chemia", "inne"];

export default function ExpensesListPage() {
    const { user } = useUserStore();
    const navigate = useNavigate();

    const [amount, setAmount] = useState(0);
    const [store, setStore] = useState("");
    const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
    const [category, setCategory] = useState("");

    const [amountError, setAmountError] = useState("");
    const [storeError, setStoreError] = useState("");
    const [dateError, setDateError] = useState("");
    const [categoryError, setCategoryError] = useState("");

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

        const { error } = await supabase.from("expenses").insert({
            amount,
            store: store.trim(),
            date,
            category,
            user_id: user.id,
        });

        if (error) {
            console.error("Błąd zapisu wydatku:", error.message);
            // Można dodać globalny błąd, jeśli chcesz
            return;
        }

        navigate("/expenses");
    };

    return (
        <div className="p-4 max-w-2xl mx-auto space-y-4">
            <h2 className="text-xl font-bold">💸 Nowy wydatek</h2>

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
