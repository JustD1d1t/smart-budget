import { CATEGORIES } from "../../utils/categories";
import Input from "../ui/Input";
import Select from "../ui/Select";

const SORT_OPTIONS = [
    { label: "Kategoria (A-Z)", value: "category_asc" },
    { label: "Kategoria (Z-A)", value: "category_desc" },
    { label: "Data (najnowsze)", value: "date_desc" },
    { label: "Data (najstarsze)", value: "date_asc" },
    { label: "Kwota (rosnąco)", value: "amount_asc" },
    { label: "Kwota (malejąco)", value: "amount_desc" },
];

type Props = {
    filterCategory: string;
    onFilterCategoryChange: (val: string) => void;
    sortOption: string;
    onSortOptionChange: (val: string) => void;
    startDate: string;
    endDate: string;
    onStartDateChange: (val: string) => void;
    onEndDateChange: (val: string) => void;
};

export default function ExpenseFilters({
    filterCategory,
    onFilterCategoryChange,
    sortOption,
    onSortOptionChange,
    startDate,
    endDate,
    onStartDateChange,
    onEndDateChange,
}: Props) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <Select
                value={filterCategory}
                onChange={(e) => onFilterCategoryChange(e.target.value)}
                options={CATEGORIES}
                placeholder="Filtruj po kategorii"
            />
            <Select
                value={sortOption}
                onChange={(e) =>
                    onSortOptionChange(
                        SORT_OPTIONS.find((o) => o.label === e.target.value)?.value || ""
                    )
                }
                options={SORT_OPTIONS.map((o) => o.label)}
                placeholder="Sortuj wydatki"
            />
            <Input
                type="date"
                value={startDate}
                onChange={(e) => onStartDateChange(e.target.value)}
            />
            <Input
                type="date"
                value={endDate}
                onChange={(e) => onEndDateChange(e.target.value)}
            />
        </div>
    );
}
