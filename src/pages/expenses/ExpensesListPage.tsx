import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import ExpenseFilters from "../../components/expenses/ExpenseFilters";
import ExpenseItem from "../../components/expenses/ExpenseItem";
import Button from "../../components/ui/Button";
import { useExpensesStore } from "../../stores/expensesStore";
import { useUserStore } from "../../stores/userStore";

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

function formatPLN(value: number) {
    return new Intl.NumberFormat("pl-PL", {
        style: "currency",
        currency: "PLN",
        maximumFractionDigits: 2,
    }).format(value || 0);
}

export default function ExpensesListPage() {
    const { user } = useUserStore();
    const navigate = useNavigate();
    const location = useLocation();

    const { expenses, fetchExpenses, deleteExpense, loading } = useExpensesStore();

    const [filterCategory, setFilterCategory] = useState("");
    const [sortOption, setSortOption] = useState("date_desc");
    const { start, end } = getStartAndEndOfMonth(new Date());
    const [startDate, setStartDate] = useState(start);
    const [endDate, setEndDate] = useState(end);

    useEffect(() => {
        if (user?.id) {
            // zakładam, że Twoje fetchExpenses przyjmuje (userId, from, to)
            fetchExpenses(user.id, startDate, endDate);
        }
    }, [user?.id, startDate, endDate, fetchExpenses]);

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

    // 🔽 SUMA z aktualnie wyświetlanych wydatków (bez zmian w store)
    const totalVisible = useMemo(
        () => visibleExpenses.reduce((acc, e) => acc + (Number(e.amount) || 0), 0),
        [visibleExpenses]
    );

    const handleDelete = async (id: string) => {
        if (!user?.id) return;
        await deleteExpense(id, user.id);
    };

    const handleEdit = (id: string) => {
        navigate(`/expenses/edit/${id}`);
    };

    // 🔽 klik w ikonę → bez nowej strony, tylko query param ?details=1
    const openDetails = () => {
        const url = new URL(window.location.href);
        url.searchParams.set("details", "1");
        navigate(`${location.pathname}${url.search}`);
    };

    return (
        <>
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

            <div className="mb-6 flex items-center justify-between">
                <Button onClick={() => navigate("/expenses/new")}>➕ Dodaj nowy wydatek</Button>

                {/* 🔽 Pasek podsumowania — kompaktowy, obok przycisku, jeśli chcesz go "pod" przyciskiem,
              przenieś cały ten <div> niżej i daj pełną szerokość */}
            </div>

            {/* 🔽 Wersja "pod przyciskiem": pełna szerokość, suma po lewej, ikona po prawej */}
            <div className="mb-6 flex items-center justify-between rounded-xl border p-4">
                <div>
                    <div className="text-sm font-medium">Suma wydatków w wybranym okresie</div>
                    <div className="text-xl font-semibold">{formatPLN(totalVisible)}</div>
                </div>

                <button
                    type="button"
                    onClick={openDetails}
                    aria-label="Przejdź do szczegółów wydatków"
                    className="inline-flex items-center rounded-full p-2 hover:bg-black/5"
                    title="Szczegóły"
                >
                    {/* Prosta ikona strzałki; możesz podmienić na lucide-react ArrowRightCircle */}
                    <svg width="28" height="28" viewBox="0 0 24 24" aria-hidden>
                        <path d="M12 4l1.41 1.41L8.83 10H20v2H8.83l4.58 4.59L12 18l-8-8 8-8z" />
                    </svg>
                </button>
            </div>

            {loading ? (
                <p>Ładowanie...</p>
            ) : (
                <ul className="divide-y">
                    {/* Nagłówek */}
                    <li className="grid grid-cols-4 gap-2 font-semibold text-sm text-left pb-2">
                        <span>Sklep</span>
                        <span>Kwota</span>
                        <span>Data</span>
                        <span>Kategoria</span>
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
        </>
    );
}
