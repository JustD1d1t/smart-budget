import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../../components/ui/Button";
import Select from "../../components/ui/Select";
import { supabase } from "../../lib/supabaseClient";
import { useUserStore } from "../../stores/userStore";

export type Expense = {
    id: string;
    amount: number;
    store: string;
    date: string; // ISO string
    category: string;
};

const CATEGORIES = ["", "żywność", "samochód", "rozrywka", "chemia", "inne"];
const SORT_OPTIONS = [
    { label: "Kategoria (A-Z)", value: "category_asc" },
    { label: "Kategoria (Z-A)", value: "category_desc" },
    { label: "Data (najnowsze)", value: "date_desc" },
    { label: "Data (najstarsze)", value: "date_asc" },
    { label: "Kwota (rosnąco)", value: "amount_asc" },
    { label: "Kwota (malejąco)", value: "amount_desc" }
];

function formatDateLocal(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

function getStartAndEndOfMonth(date: Date) {
    const start = new Date(date.getFullYear(), date.getMonth(), 1);
    const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    return {
        start: formatDateLocal(start),
        end: formatDateLocal(end),
    };
}

export default function ExpensesListPage() {
    const { user } = useUserStore();
    const navigate = useNavigate();

    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [loading, setLoading] = useState(false);
    const [filterCategory, setFilterCategory] = useState("");
    const [sortOption, setSortOption] = useState("date_desc");

    const { start, end } = getStartAndEndOfMonth(new Date());
    const [startDate, setStartDate] = useState(start);
    const [endDate, setEndDate] = useState(end);

    useEffect(() => {
        const fetchExpenses = async () => {
            if (!user?.id) return;
            setLoading(true);

            let query = supabase
                .from("expenses")
                .select("*")
                .eq("user_id", user.id)
                .gte("date", startDate)
                .lte("date", endDate);

            if (filterCategory) {
                query = query.eq("category", filterCategory);
            }

            const { data, error } = await query;

            if (error) {
                console.error("Błąd ładowania wydatków:", error.message);
            } else {
                const sorted = data.sort(
                    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
                );
                setExpenses(sorted);
            }

            setLoading(false);
        };

        fetchExpenses();
    }, [user?.id, filterCategory, startDate, endDate]);

    useEffect(() => {
        const sortExpenses = () => {
            const sorted = [...expenses].sort((a, b) => {
                switch (sortOption) {
                    case "category_asc":
                        return (a.category || "").localeCompare(b.category || "");
                    case "category_desc":
                        return (b.category || "").localeCompare(a.category || "");
                    case "date_asc":
                        return new Date(a.date).getTime() - new Date(b.date).getTime();
                    case "date_desc":
                        return new Date(b.date).getTime() - new Date(a.date).getTime();
                    case "amount_asc":
                        return a.amount - b.amount;
                    case "amount_desc":
                        return b.amount - a.amount;
                    default:
                        return 0;
                }
            });
            setExpenses(sorted);
        };

        if (expenses.length > 0) {
            sortExpenses();
        }
    }, [sortOption]);

    const handleDelete = async (id: string) => {
        const { error } = await supabase.from("expenses").delete().eq("id", id);
        if (error) {
            console.error("Błąd usuwania wydatku:", error.message);
            return;
        }
        setExpenses((prev) => prev.filter((e) => e.id !== id));
    };

    const handleEdit = (id: string) => {
        navigate(`/expenses/edit/${id}`);
    };

    const changeSortOption = (option: string) => {
        setSortOption(option);
    };

    return (
        <div className="p-4 max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold mb-4">📋 Lista wydatków</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <Select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    options={CATEGORIES.slice(1)}
                    placeholder="Filtruj po kategorii"
                />
                <Select
                    value={sortOption}
                    onChange={(e) =>
                        changeSortOption(
                            SORT_OPTIONS.find((o) => o.label === e.target.value)?.value || ""
                        )
                    }
                    options={SORT_OPTIONS.map((o) => o.label)}
                    placeholder="Sortuj wydatki"
                />
                <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="border rounded px-3 py-2 text-sm"
                />
                <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="border rounded px-3 py-2 text-sm"
                />
            </div>

            {loading ? (
                <p>Ładowanie...</p>
            ) : (
                <ul className="divide-y">
                    <li className="grid grid-cols-6 gap-2 font-semibold text-sm text-left pb-2">
                        <span>Sklep</span>
                        <span>Kwota</span>
                        <span>Data</span>
                        <span>Kategoria</span>
                        <span colSpan={2}></span>
                    </li>
                    {expenses.map((exp) => (
                        <li
                            key={exp.id}
                            className="py-3 grid grid-cols-6 gap-2 text-sm text-left items-center"
                        >
                            <span>{exp.store}</span>
                            <span>{exp.amount.toFixed(2)} zł</span>
                            <span className="text-gray-500">{exp.date}</span>
                            <span className="text-gray-400 italic">{exp.category}</span>
                            <Button variant="ghost" onClick={() => handleEdit(exp.id)}>
                                ✏️ Edytuj
                            </Button>
                            <Button variant="ghost" onClick={() => handleDelete(exp.id)}>
                                🗑 Usuń
                            </Button>
                        </li>
                    ))}
                </ul>
            )}

            {expenses.length === 0 && !loading && (
                <p className="text-gray-500">Brak zapisanych wydatków.</p>
            )}

            <Button className="mt-6" onClick={() => navigate("/expenses/new")}>
                ➕ Dodaj nowy wydatek
            </Button>
        </div>
    );
}
