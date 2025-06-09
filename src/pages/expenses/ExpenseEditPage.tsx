import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Select from "../../components/ui/Select";
import { supabase } from "../../lib/supabaseClient";
import { useUserStore } from "../../stores/userStore";

const CATEGORIES = ["żywność", "samochód", "rozrywka", "chemia", "inne"];

export default function EditExpensePage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useUserStore();

    const [amount, setAmount] = useState(0);
    const [store, setStore] = useState("");
    const [date, setDate] = useState("");
    const [category, setCategory] = useState("");

    useEffect(() => {
        const fetchExpense = async () => {
            if (!id || !user?.id) return;
            const { data, error } = await supabase
                .from("expenses")
                .select("*")
                .eq("id", id)
                .eq("user_id", user.id)
                .single();

            if (error) {
                console.error("Błąd ładowania wydatku:", error.message);
                return;
            }

            setAmount(data.amount);
            setStore(data.store);
            setDate(data.date);
            setCategory(data.category || "");
        };

        fetchExpense();
    }, [id, user?.id]);

    const handleSave = async () => {
        if (!id || !user?.id || !store.trim() || !amount || !date || !category) return;

        const { error } = await supabase
            .from("expenses")
            .update({ amount, store: store.trim(), date, category })
            .eq("id", id)
            .eq("user_id", user.id);

        if (error) {
            console.error("Błąd zapisu zmian:", error.message);
            return;
        }

        navigate("/expenses");
    };

    return (
        <div className="p-4 max-w-xl mx-auto space-y-4">
            <h1 className="text-2xl font-bold">✏️ Edytuj wydatek</h1>

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
