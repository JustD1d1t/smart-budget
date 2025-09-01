import dayjs from "dayjs";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
    CartesianGrid,
    Line,
    LineChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";

import ExpenseFilters from "../../components/expenses/ExpenseFilters";
import Button from "../../components/ui/Button";
import { useExpensesStore } from "../../stores/expensesStore";
import { useUserStore } from "../../stores/userStore";

/* Helpers */
function formatDateLocal(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
}
function getStartAndEndOfMonth(date: Date) {
    const start = new Date(date.getFullYear(), date.getMonth(), 1);
    const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    return { start: formatDateLocal(start), end: formatDateLocal(end) };
}
function formatPLN(v: number) {
    return new Intl.NumberFormat("pl-PL", { style: "currency", currency: "PLN" }).format(v || 0);
}
function enumerateDays(fromISO: string, toISO: string): string[] {
    const res: string[] = [];
    let d = dayjs(fromISO);
    const end = dayjs(toISO);
    while (d.isBefore(end) || d.isSame(end, "day")) {
        res.push(d.format("YYYY-MM-DD"));
        d = d.add(1, "day");
    }
    return res;
}

/* Page */
export default function ExpensesChartPage() {
    const navigate = useNavigate();
    const [sp, setSp] = useSearchParams();

    const { user } = useUserStore();
    const { expenses, fetchExpenses, loading } = useExpensesStore();

    const { start, end } = getStartAndEndOfMonth(new Date());
    const [startDate, setStartDate] = useState(start);
    const [endDate, setEndDate] = useState(end);

    // Multi-select
    const [selectedCats, setSelectedCats] = useState<string[]>([]);

    // Jednorazowa inicjalizacja z URL (opcjonalnie)
    const initOnce = useRef(false);
    useEffect(() => {
        if (initOnce.current) return;
        initOnce.current = true;
        const fromQ = sp.get("from");
        const toQ = sp.get("to");
        const catsQ = sp.get("categories");
        if (fromQ) setStartDate(fromQ);
        if (toQ) setEndDate(toQ);
        if (catsQ) {
            const parsed = catsQ
                .split(",")
                .map((x) => x.trim())
                .filter(Boolean);
            setSelectedCats(parsed);
        }
    }, [sp]);

    // Pobieranie danych
    useEffect(() => {
        if (user?.id) {
            fetchExpenses(user.id, startDate, endDate);
        }
    }, [user?.id, startDate, endDate, fetchExpenses]);

    // Aktualizuj URL przy zmianie filtrów (shareowalny link)
    useEffect(() => {
        const next = new URLSearchParams(sp);
        if (startDate) next.set("from", startDate);
        if (endDate) next.set("to", endDate);
        if (selectedCats.length > 0) next.set("categories", selectedCats.join(","));
        else next.delete("categories");
        // sort tu nieużywany → usuwamy dla czytelności
        next.delete("sort");
        setSp(next, { replace: true });
    }, [startDate, endDate, selectedCats, setSp]);

    // Kategorie dostępne w danych (dla listy opcji – bez wymuszania all)
    const categoryOptions = useMemo(() => {
        const s = new Set<string>();
        for (const e of expenses) if (e.category) s.add(e.category);
        return Array.from(s).sort((a, b) => a.localeCompare(b));
    }, [expenses]);

    // Filtrowanie po kategoriach (pusta selekcja = brak filtra = wszystkie)
    const filtered = useMemo(() => {
        const base =
            selectedCats.length > 0
                ? expenses.filter((e) => selectedCats.includes(e.category))
                : expenses;
        return base;
    }, [expenses, selectedCats]);

    // Agregacja per dzień
    const chartData = useMemo(() => {
        if (!startDate || !endDate) return [];
        const days = enumerateDays(startDate, endDate);
        const byDay = new Map<string, number>();
        for (const d of days) byDay.set(d, 0);
        for (const e of filtered) {
            const d = dayjs(e.date).format("YYYY-MM-DD");
            if (byDay.has(d)) byDay.set(d, (byDay.get(d) || 0) + (Number(e.amount) || 0));
        }
        return days.map((d) => ({
            day: dayjs(d).format("DD.MM"),
            total: byDay.get(d) || 0,
            iso: d,
        }));
    }, [filtered, startDate, endDate]);

    const totalInRange = useMemo(
        () => filtered.reduce((acc, e) => acc + (Number(e.amount) || 0), 0),
        [filtered]
    );

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">📈 Wykres wydatków</h1>
                <div className="flex gap-2">
                    <Button variant="ghost" onClick={() => navigate(-1)}>
                        ← Wróć
                    </Button>
                    <Button onClick={() => navigate("/expenses")}>Lista wydatków</Button>
                </div>
            </div>

            {/* Te same filtry (multi), bez sekcji sortowania */}
            <ExpenseFilters
                startDate={startDate}
                endDate={endDate}
                onStartDateChange={setStartDate}
                onEndDateChange={setEndDate}
                categories={categoryOptions}
                selectedCategories={selectedCats}
                onSelectedCategoriesChange={setSelectedCats}
            // sortOption/onSortOptionChange nie podajemy → sekcja sortu się nie pokaże
            />

            {/* Pasek podsumowania */}
            <section className="rounded-xl border p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="text-sm">
                        <div className="font-medium">Suma w wybranym okresie</div>
                        <div className="text-xl font-semibold">{formatPLN(totalInRange)}</div>
                    </div>
                    <div className="text-sm text-gray-600">
                        Zakres: <strong>{startDate}</strong> – <strong>{endDate}</strong> • Kategorie:{" "}
                        <strong>
                            {selectedCats.length ? selectedCats.join(", ") : "Wszystkie"}
                        </strong>
                    </div>
                </div>
            </section>

            {/* Wykres */}
            <section className="rounded-xl border p-4">
                <div className="mb-3 flex items-center justify-between">
                    <h2 className="text-lg font-semibold">Wydatki dzienne</h2>
                    <span className="text-sm text-gray-500">
                        Punkty: {chartData.length} • Ładowanie: {loading ? "tak" : "nie"}
                    </span>
                </div>

                <div className="h-[340px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData} margin={{ top: 10, right: 24, left: 0, bottom: 10 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="day" />
                            <YAxis
                                tickFormatter={(v) =>
                                    new Intl.NumberFormat("pl-PL", { maximumFractionDigits: 0 }).format(v as number)
                                }
                            />
                            <Tooltip
                                formatter={(value: any) => formatPLN(Number(value))}
                                labelFormatter={(_, payload) => {
                                    const p = payload?.[0]?.payload as any;
                                    return p?.iso ? dayjs(p.iso).format("dddd, DD MMM YYYY") : "";
                                }}
                            />
                            <Line type="monotone" dataKey="total" strokeWidth={2} dot={false} isAnimationActive={false} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </section>
        </div>
    );
}
