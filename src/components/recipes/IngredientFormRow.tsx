import ProductAutocomplete from "../shopping-list/ProductAutocomplete";
import Button from "../ui/Button";
import Input from "../ui/Input";
import Select from "../ui/Select";

const UNITS = ["g", "kg", "ml", "l", "szt.", "łyżka", "łyżeczka", "szklanka"];

export type Ingredient = {
    name: string;
    quantity: number;
    unit: string;
};

export type IngredientError = {
    name?: string;
    quantity?: string;
    unit?: string;
};

type Props = {
    index: number;
    ingredient: Ingredient;
    onChange: (index: number, updated: Ingredient) => void;
    onRemove: (index: number) => void;
    errors?: IngredientError;
    productsDb: { name: string; category: string }[];
};

export default function IngredientFormRow({
    index,
    ingredient,
    onChange,
    onRemove,
    errors = {},
    productsDb,
}: Props) {
    const handleChange = (field: keyof Ingredient, value: string | number) => {
        onChange(index, { ...ingredient, [field]: value });
    };

    return (
        <div className="flex flex-wrap gap-2 items-start">
            <div className="flex-1 min-w-[120px]">
                <ProductAutocomplete
                    productsDb={productsDb}
                    value={ingredient.name}
                    onChange={(val) => handleChange("name", val)}
                    onClick={(val) => handleChange("name", val)}
                    error={errors.name}
                />
            </div>
            <div className="w-24">
                <Input
                    type="number"
                    value={ingredient.quantity.toString()}
                    onChange={(e) => handleChange("quantity", Number(e.target.value))}
                    error={errors.quantity}
                />
            </div>
            <div className="w-32">
                <Select
                    value={ingredient.unit}
                    onChange={(e) => handleChange("unit", e.target.value)}
                    options={UNITS}
                    className="w-full"
                    placeholder="-- wybierz --"
                />
                {errors.unit && <p className="text-sm text-red-500 mt-1">{errors.unit}</p>}
            </div>
            <Button variant="ghost" onClick={() => onRemove(index)}>
                Usuń
            </Button>
        </div>
    );
}
