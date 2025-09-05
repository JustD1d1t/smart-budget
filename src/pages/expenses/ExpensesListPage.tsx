import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import ExpenseFilters, { SortOption } from "../../components/expenses/ExpenseFilters";
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
    return { start: formatDateLocal(start), end: formatDateLocal(end) };
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

    const [sortOption, setSortOption] = useState<SortOption>("date_desc");
    const { start, end } = getStartAndEndOfMonth(new Date());
    const [startDate, setStartDate] = useState(start);
    const [endDate, setEndDate] = useState(end);
    const [collabFilter, setCollabFilter] = useState<"all" | "own" | "with_collaborators">("all");

    // Multi-select kategorii
    const [selectedCats, setSelectedCats] = useState<string[]>([]);

    useEffect(() => {
        if (user?.id) {
            fetchExpenses(user.id, startDate, endDate);
        }
    }, [user?.id, startDate, endDate, fetchExpenses]);

    const categoryOptions = useMemo(() => {
        const s = new Set<string>();
        for (const e of expenses) if (e.category) s.add(e.category);
        return Array.from(s).sort((a, b) => a.localeCompare(b));
    }, [expenses]);

    const visibleExpenses = useMemo(() => {
        // 1) filtr po kategoriach
        const byCats =
            selectedCats.length > 0
                ? expenses.filter((e) => selectedCats.includes(e.category))
                : expenses;

        // 2) filtr "własne / ze współtwórcami / wszystkie"
        const byCollab = byCats.filter((e) => {
            if (collabFilter === "all") return true;

            // Spróbujmy policzyć członków różnymi polami, w zależności od modelu:
            const memberCount =
                (Array.isArray((e as any).members) ? (e as any).members.length : undefined) ??
                (Array.isArray((e as any).shared_user_ids) ? (e as any).shared_user_ids.length : undefined) ??
                // fallback: jeśli nie mamy pól członków, to traktuj jako "tylko właściciel"
                1;

            if (collabFilter === "own") return memberCount <= 1;
            // "with_collaborators"
            return memberCount > 1;
        });

        // 3) sortowanie
        return [...byCollab].sort((a, b) => {
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
    }, [expenses, selectedCats, sortOption, collabFilter]);

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

    // Query → /expenses/chart
    const buildSearch = () => {
        const sp = new URLSearchParams();
        if (startDate) sp.set("from", startDate);
        if (endDate) sp.set("to", endDate);
        if (selectedCats.length > 0) sp.set("categories", selectedCats.join(","));
        if (sortOption) sp.set("sort", sortOption);
        const s = sp.toString();
        return s ? `?${s}` : "";
        // chart strona i tak sortu nie użyje, ale niech leci dla spójności URL
    };

    const goToChart = () => {
        navigate(`/expenses/chart${buildSearch()}`);
    };

    return (
        <>
            <h1 className="mb-4 text-2xl font-bold">📋 Lista wydatków</h1>

            <ExpenseFilters
                startDate={startDate}
                endDate={endDate}
                onStartDateChange={setStartDate}
                onEndDateChange={setEndDate}
                categories={categoryOptions}
                selectedCategories={selectedCats}
                onSelectedCategoriesChange={setSelectedCats}
                sortOption={sortOption}
                onSortOptionChange={setSortOption}
                collabFilter={collabFilter}
                onCollabFilterChange={setCollabFilter}
            />

            <div className="mb-6 flex items-center justify-between">
                <Button onClick={() => navigate("/expenses/new")}>➕ Dodaj nowy wydatek</Button>
            </div>

            <div className="mb-6 flex items-center justify-between rounded-xl border p-4">
                <div>
                    <div className="text-sm font-medium">Suma wydatków w wybranym okresie</div>
                    <div className="text-xl font-semibold">{formatPLN(totalVisible)}</div>
                </div>

                <button
                    type="button"
                    onClick={goToChart}
                    aria-label="Przejdź do szczegółów wydatków"
                    className="inline-flex items-center rounded-full p-2 hover:bg-black/5"
                    title="Szczegóły"
                >
                    <svg width="28" height="28" viewBox="0 0 24 24" aria-hidden>
                        <path d="M12 4l1.41 1.41L8.83 10H20v2H8.83l4.58 4.59L12 18l-8-8 8-8z" />
                    </svg>
                </button>
            </div>

            {loading ? (
                <p>Ładowanie...</p>
            ) : (
                <ul className="divide-y">
                    <li className="grid grid-cols-4 gap-2 pb-2 text-left text-sm font-semibold">
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
