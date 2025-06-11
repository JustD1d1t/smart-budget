// src/pages/EditExpensePage.tsx
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import MemberList from "../../components/ui/MemberList";
import Select from "../../components/ui/Select";
import Toast from "../../components/ui/Toast";
import { supabase } from "../../lib/supabaseClient";
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

    const [amount, setAmount] = useState(0);
    const [store, setStore] = useState("");
    const [date, setDate] = useState("");
    const [category, setCategory] = useState("");
    const [sharedWith, setSharedWith] = useState<Member[]>([]);
    const [toast, setToast] = useState<{ message: string; type?: "error" | "success" } | null>(null);

    useEffect(() => {
        const fetchExpense = async () => {
            if (!id || !user?.id) return;
            const { data, error } = await supabase
                .from("expenses")
                .select("*")
                .eq("id", id)
                .eq("user_id", user.id)
                .single();

            if (error || !data) {
                setToast({ message: "Błąd ładowania wydatku.", type: "error" });
                return;
            }

            setAmount(data.amount);
            setStore(data.store);
            setDate(data.date);
            setCategory(data.category || "");

            if (Array.isArray(data.shared_with)) {
                const { data: users } = await supabase
                    .from("users")
                    .select("id, email")
                    .in("id", data.shared_with);

                if (users) {
                    const mapped = users.map((u) => ({ id: u.id, email: u.email, role: "viewer" }));
                    setSharedWith(mapped);
                }
            }
        };

        fetchExpense();
    }, [id, user?.id]);

    const handleInvite = async (email: string) => {
        const alreadyAdded = sharedWith.some((m) => m.email === email);
        if (alreadyAdded) {
            setToast({ message: "Użytkownik już dodany.", type: "error" });
            return;
        }

        const { data: userData, error } = await supabase
            .from("users")
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

        const { error: updateError } = await supabase
            .from("expenses")
            .update({
                amount,
                store: store.trim(),
                date,
                category,
            })
            .eq("id", id)
            .eq("user_id", user.id);

        if (updateError) {
            setToast({ message: "Błąd zapisu zmian.", type: "error" });
            return;
        }

        await supabase.from("expense_viewers").delete().eq("expense_id", id);

        if (sharedWith.length > 0) {
            const { error: viewerError } = await supabase
                .from("expense_viewers")
                .insert(sharedWith.map((m) => ({ expense_id: id, user_id: m.id })));

            if (viewerError) {
                console.error("Błąd dodawania viewerów:", viewerError.message);
            }
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
