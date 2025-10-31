import React, { useMemo, useState } from "react";
import { PANTRY_ITEMS_CATEGORIES } from "../../utils/categories";
import Select from "../ui/Select";

interface AddPantryItemFormProps {
    pantryId: string;
    onItemAdded: (item: any) => void | Promise<void>;
}

const UNITS = ["szt", "kg"];

export default function AddPantryItemForm({ pantryId, onItemAdded }: AddPantryItemFormProps) {
    const [name, setName] = useState("");
    const [category, setCategory] = useState("żywność");
    const [quantity, setQuantity] = useState(1);
    const [unit, setUnit] = useState("szt");
    const [expiryDate, setExpiryDate] = useState("");

    const canSubmit = useMemo(() => {
        const validQty = Number.isFinite(quantity) && quantity > 0;
        return (
            name.trim().length > 0 &&
            category.trim().length > 0 &&
            unit.trim().length > 0 &&
            validQty
        );
    }, [name, category, unit, quantity]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!canSubmit) return;

        const newItem = {
            name: name.trim(),
            category,
            quantity: Number(quantity),
            unit,
            expiry_date: expiryDate || null,
            pantry_id: pantryId,
        };

        await onItemAdded(newItem);

        // reset formularza (z zachowaniem domyślnej kategorii)
        setName("");
        setCategory("Żywność");
        setQuantity(1);
        setUnit("szt");
        setExpiryDate("");
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            {/* Nazwa */}
            <input
                type="text"
                placeholder="Nazwa produktu"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="border rounded p-2"
                required
            />

            {/* Kategoria (Select) */}
            <Select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                options={PANTRY_ITEMS_CATEGORIES}
                placeholder="Kategoria"
            />

            {/* Ilość + Jednostka */}
            <div className="flex gap-2">
                <input
                    type="number"
                    placeholder="Ilość"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(0, Number(e.target.value)))}
                    className="border rounded p-2 w-1/2"
                    min={0}
                    required
                />
                <Select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    options={UNITS}
                    placeholder="Jednostka"
                />
            </div>

            {/* Data przydatności + czyść */}
            <div className="flex items-center gap-2">
                <input
                    type="date"
                    placeholder="Data przydatności"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    className="border rounded p-2 flex-1"
                />
                {expiryDate && (
                    <button
                        type="button"
                        onClick={() => setExpiryDate("")}
                        className="px-2 py-1 text-gray-500 hover:text-black border rounded"
                        aria-label="Wyczyść datę"
                    >
                        ✕
                    </button>
                )}
            </div>

            <button
                type="submit"
                disabled={!canSubmit}
                className={`rounded p-2 transition text-white ${canSubmit
                        ? "bg-blue-600 hover:bg-blue-700"
                        : "bg-blue-300 cursor-not-allowed"
                    }`}
            >
                Dodaj produkt
            </button>
        </form>
    );
}
