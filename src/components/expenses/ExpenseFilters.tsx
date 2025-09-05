import { ChangeEvent, useMemo, useState } from "react";
import { CATEGORIES } from "../../utils/categories";

export type SortOption =
    | "date_desc"
    | "date_asc"
    | "amount_desc"
    | "amount_asc"
    | "category_asc"
    | "category_desc";

export type CollaborationFilter = "all" | "own" | "with_collaborators";

type Props = {
    // Daty
    startDate: string;
    endDate: string;
    onStartDateChange: (v: string) => void;
    onEndDateChange: (v: string) => void;

    // Kategorie (multi)
    categories?: string[]; // jeżeli nie podasz, użyje CATEGORIES z utils
    selectedCategories: string[]; // pusta tablica = "wszystkie"
    onSelectedCategoriesChange: (v: string[]) => void;

    // Filtr według współtwórców (WYMAGANY)
    collabFilter: CollaborationFilter;
    onCollabFilterChange: (v: CollaborationFilter) => void;

    // Sort (opcjonalnie – pokaże sekcję tylko gdy oba poniższe propsy są podane)
    sortOption?: SortOption;
    onSortOptionChange?: (v: SortOption) => void;

    // UI
    defaultOpen?: boolean; // domyślnie false (zwinięty)
};

function Chevron({ open }: { open: boolean }) {
    return (
        <svg
            className={`h-5 w-5 transition-transform ${open ? "rotate-180" : ""}`}
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden
        >
            <path
                d="M6 9l6 6 6-6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}

function sortLabel(opt: SortOption): string {
    const map: Record<SortOption, string> = {
        category_asc: "Kategoria ↑",
        category_desc: "Kategoria ↓",
        date_asc: "Data ↑",
        date_desc: "Data ↓",
        amount_asc: "Kwota ↑",
        amount_desc: "Kwota ↓",
    };
    return map[opt] ?? String(opt);
}

function collabLabel(v: CollaborationFilter): string {
    switch (v) {
        case "own":
            return "Własne";
        case "with_collaborators":
            return "Ze współtwórcami";
        default:
            return "Wszystkie";
    }
}

export default function ExpenseFilters({
    startDate,
    endDate,
    onStartDateChange,
    onEndDateChange,

    categories,
    selectedCategories,
    onSelectedCategoriesChange,

    collabFilter,
    onCollabFilterChange,

    sortOption,
    onSortOptionChange,

    defaultOpen = false,
}: Props) {
    const [open, setOpen] = useState(defaultOpen);
    const cats = (categories && categories.length ? categories : CATEGORIES) ?? [];

    // Summary (pusta selekcja = "Wszystkie")
    const summary = useMemo(() => {
        const catSummary =
            selectedCategories.length === 0
                ? "Wszystkie"
                : selectedCategories.length === cats.length
                    ? "Wszystkie"
                    : selectedCategories.join(", ");

        const parts: string[] = [];
        parts.push(`od ${startDate || "—"}`);
        parts.push(`do ${endDate || "—"}`);
        parts.push(`kategorie: ${catSummary}`);
        parts.push(`typ: ${collabLabel(collabFilter)}`);
        if (sortOption && onSortOptionChange) parts.push(`sort: ${sortLabel(sortOption)}`);
        return parts.join(" • ");
    }, [
        startDate,
        endDate,
        selectedCategories,
        cats.length,
        sortOption,
        onSortOptionChange,
        collabFilter,
    ]);

    const allSelected =
        selectedCategories.length > 0 && selectedCategories.length === cats.length;

    const onMultiChange = (e: ChangeEvent<HTMLSelectElement>) => {
        const values = Array.from(e.target.selectedOptions).map((o) => o.value);
        onSelectedCategoriesChange(values);
    };

    const selectAll = () => onSelectedCategoriesChange(cats);
    const clearAll = () => onSelectedCategoriesChange([]);

    return (
        <section className="mb-4 rounded-xl border">
            {/* Nagłówek */}
            <button
                type="button"
                onClick={() => setOpen((o) => !o)}
                className="flex w-full items-start justify-between gap-3 p-3 text-left"
                aria-expanded={open}
                aria-controls="expense-filters-panel"
            >
                <div className="min-w-0 flex-1">
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:gap-3">
                        <span className="shrink-0 text-base font-semibold">Filtry</span>
                        {!open && (
                            <span
                                className="text-sm text-gray-500 whitespace-normal break-words leading-snug"
                                title={summary}
                            >
                                {summary}
                            </span>
                        )}
                    </div>
                </div>
                <Chevron open={open} />
            </button>

            {/* Panel */}
            <div
                id="expense-filters-panel"
                className={`grid grid-cols-1 gap-4 px-4 pb-4 transition-[grid-template-rows,opacity] ${open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                    }`}
            >
                <div className="overflow-hidden">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                        {/* Data od */}
                        <label className="flex flex-col gap-1">
                            <span className="text-sm font-medium">Od</span>
                            <input
                                type="date"
                                value={startDate ?? ""}
                                onChange={(e) => onStartDateChange(e.target.value)}
                                className="rounded-md border px-3 py-2"
                            />
                        </label>

                        {/* Data do */}
                        <label className="flex flex-col gap-1">
                            <span className="text-sm font-medium">Do</span>
                            <input
                                type="date"
                                value={endDate ?? ""}
                                onChange={(e) => onEndDateChange(e.target.value)}
                                className="rounded-md border px-3 py-2"
                            />
                        </label>

                        {/* Kategorie (multi) */}
                        <label className="flex flex-col gap-1 md:col-span-2">
                            <span className="text-sm font-medium">Kategorie</span>
                            <select
                                multiple
                                value={selectedCategories}
                                onChange={onMultiChange}
                                className="min-h-[130px] rounded-md border px-3 py-2"
                            >
                                {cats.map((c) => (
                                    <option key={c} value={c}>
                                        {c}
                                    </option>
                                ))}
                            </select>

                            <div className="mt-2 flex gap-2">
                                <button
                                    type="button"
                                    className="text-sm underline disabled:opacity-50"
                                    onClick={selectAll}
                                    disabled={allSelected || cats.length === 0}
                                >
                                    Zaznacz wszystko
                                </button>
                                <button
                                    type="button"
                                    className="text-sm underline disabled:opacity-50"
                                    onClick={clearAll}
                                    disabled={selectedCategories.length === 0}
                                >
                                    Wyczyść
                                </button>
                            </div>
                        </label>

                        {/* Typ wydatków (współtwórcy) */}
                        <label className="flex flex-col gap-1 md:col-span-1">
                            <span className="text-sm font-medium">Typ wydatków</span>
                            <select
                                value={collabFilter}
                                onChange={(e) =>
                                    onCollabFilterChange(e.target.value as CollaborationFilter)
                                }
                                className="rounded-md border px-3 py-2"
                            >
                                <option value="all">Wszystkie</option>
                                <option value="own">Własne (bez współtwórców)</option>
                                <option value="with_collaborators">Ze współtwórcami</option>
                            </select>
                        </label>

                        {/* Sort (opcjonalnie) */}
                        {sortOption && onSortOptionChange && (
                            <label className="flex flex-col gap-1 md:col-span-1">
                                <span className="text-sm font-medium">Sortowanie</span>
                                <select
                                    value={sortOption}
                                    onChange={(e) =>
                                        onSortOptionChange(e.target.value as SortOption)
                                    }
                                    className="rounded-md border px-3 py-2"
                                >
                                    <option value="date_desc">Data ↓ (najnowsze)</option>
                                    <option value="date_asc">Data ↑ (najstarsze)</option>
                                    <option value="amount_desc">Kwota ↓</option>
                                    <option value="amount_asc">Kwota ↑</option>
                                    <option value="category_asc">Kategoria A→Z</option>
                                    <option value="category_desc">Kategoria Z→A</option>
                                </select>
                            </label>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
}
