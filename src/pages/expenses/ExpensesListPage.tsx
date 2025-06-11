import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import ExpenseFilters from "../../components/expenses/ExpenseFilters";
import ExpenseItem from "../../components/expenses/ExpenseItem";
import Button from "../../components/ui/Button";
import { useExpensesStore } from "../../stores/expensesStore";
import { useUserStore } from "../../stores/userStore";

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

    const { expenses, fetchExpenses, deleteExpense, loading } = useExpensesStore();

    const [filterCategory, setFilterCategory] = useState("");
    const [sortOption, setSortOption] = useState("date_desc");
    const { start, end } = getStartAndEndOfMonth(new Date());
    const [startDate, setStartDate] = useState(start);
    const [endDate, setEndDate] = useState(end);

    useEffect(() => {
        if (user?.id) {
            fetchExpenses(user.id, startDate, endDate);
        }
    }, [user?.id, startDate, endDate]);

    const visibleExpenses = useMemo(() => {
        const filtered = filterCategory
            ? expenses.filter((e) => e.category === filterCategory)
            : expenses;

        return [...filtered].sort((a, b) => {
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
    }, [expenses, filterCategory, sortOption]);

    const handleDelete = async (id: string) => {
        if (!user?.id) return;
        await deleteExpense(id, user.id);
    };

    const handleEdit = (id: string) => {
        navigate(`/expenses/edit/${id}`);
    };

    return (
        <div className="p-4 max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold mb-4">📋 Lista wydatków</h1>

            <ExpenseFilters
                filterCategory={filterCategory}
                onFilterCategoryChange={setFilterCategory}
                sortOption={sortOption}
                onSortOptionChange={setSortOption}
                startDate={startDate}
                endDate={endDate}
                onStartDateChange={setStartDate}
                onEndDateChange={setEndDate}
            />

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
                    {visibleExpenses.map((exp) => (
                        <ExpenseItem
                            key={exp.id}
                            expense={exp}
                            onEdit={exp.user_id === user?.id ? handleEdit : undefined}
                            onDelete={exp.user_id === user?.id ? handleDelete : undefined}
                        />
                    ))}
                </ul>
            )}

            {visibleExpenses.length === 0 && !loading && (
                <p className="text-gray-500">Brak zapisanych wydatków.</p>
            )}

            <Button className="mt-6" onClick={() => navigate("/expenses/new")}>➕ Dodaj nowy wydatek</Button>
        </div>
    );
}
