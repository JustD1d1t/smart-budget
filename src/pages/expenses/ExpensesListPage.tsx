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

// luźny parser liczby dziesiętnej: "12,50" -> 12.5; zwraca NaN gdy brak
function parseDecimalLoose(v: string | undefined | null): number {
    if (v == null) return NaN;
    const s = String(v).trim().replace(",", ".");
    if (s === "") return NaN;
    const n = Number(s);
    return Number.isFinite(n) ? n : NaN;
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

    // NOWE: szukaj i zakres kwoty
    const [searchText, setSearchText] = useState("");
    const [amountMin, setAmountMin] = useState("");
    const [amountMax, setAmountMax] = useState("");

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
        // 0) normalizacja wyszukiwarki
        const q = searchText.trim().toLowerCase();

        // 1) filtr po kategoriach
        const byCats =
            selectedCats.length > 0
                ? expenses.filter((e) => selectedCats.includes(e.category || "")) // null -> ""
                : expenses;

        // 2) filtr "własne / ze współtwórcami / wszystkie"
        const byCollab = byCats.filter((e) => {
            if (collabFilter === "all") return true;

            const memberCount =
                (Array.isArray((e as any).members) ? (e as any).members.length : undefined) ??
                (Array.isArray((e as any).shared_user_ids) ? (e as any).shared_user_ids.length : undefined) ??
                1;

            if (collabFilter === "own") return memberCount <= 1;
            return memberCount > 1; // with_collaborators
        });

        // 3) filtr po tekście: store lub description
        const bySearch = q
            ? byCollab.filter((e) => {
                const store = (e as any).store ? String((e as any).store).toLowerCase() : "";
                const desc = (e as any).description ? String((e as any).description).toLowerCase() : "";
                return store.includes(q) || desc.includes(q);
            })
            : byCollab;

        // 4) filtr po kwocie
        const minN = parseDecimalLoose(amountMin);
        const maxN = parseDecimalLoose(amountMax);
        const byAmount = bySearch.filter((e) => {
            const amt = Number(e.amount) || 0;
            const geMin = Number.isNaN(minN) ? true : amt >= minN;
            const leMax = Number.isNaN(maxN) ? true : amt <= maxN;
            return geMin && leMax;
        });

        // 5) sortowanie
        return [...byAmount].sort((a, b) => {
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
                    return (a.amount || 0) - (b.amount || 0);
                case "amount_desc":
                    return (b.amount || 0) - (a.amount || 0);
                default:
                    return 0;
            }
        });
    }, [expenses, selectedCats, sortOption, collabFilter, searchText, amountMin, amountMax]);

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

    const handlePreview = (id: string) => navigate(`/expenses/view/${id}`);

    // Query → /expenses/chart
    const buildSearch = () => {
        const sp = new URLSearchParams();
        if (startDate) sp.set("from", startDate);
        if (endDate) sp.set("to", endDate);
        if (selectedCats.length > 0) sp.set("categories", selectedCats.join(","));
        if (sortOption) sp.set("sort", sortOption);
        if (searchText.trim()) sp.set("q", searchText.trim());
        if (amountMin.trim()) sp.set("min", amountMin.trim());
        if (amountMax.trim()) sp.set("max", amountMax.trim());
        const s = sp.toString();
        return s ? `?${s}` : "";
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
                // NOWE propsy
                searchText={searchText}
                onSearchTextChange={setSearchText}
                amountMin={amountMin}
                onAmountMinChange={setAmountMin}
                amountMax={amountMax}
                onAmountMaxChange={setAmountMax}
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
                            onPreview={handlePreview}
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
