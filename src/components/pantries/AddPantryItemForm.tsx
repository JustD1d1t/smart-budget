import React, { useState } from "react";

interface AddPantryItemFormProps {
    pantryId: string;
    onItemAdded: (item: any) => void;
}

export default function AddPantryItemForm({ pantryId, onItemAdded }: AddPantryItemFormProps) {
    const [name, setName] = useState("");
    const [category, setCategory] = useState("");
    const [quantity, setQuantity] = useState(1);
    const [unit, setUnit] = useState("szt"); // ✅ domyślnie "szt"
    const [expiryDate, setExpiryDate] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const newItem = {
            name,
            category,
            quantity,
            unit,
            expiry_date: expiryDate || null,
            pantry_id: pantryId,
        };

        await onItemAdded(newItem);

        // reset formularza
        setName("");
        setCategory("");
        setQuantity(1);
        setUnit("szt");
        setExpiryDate("");
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <input
                type="text"
                placeholder="Nazwa produktu"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="border rounded p-2"
                required
            />

            <input
                type="text"
                placeholder="Kategoria"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="border rounded p-2"
            />

            <div className="flex gap-2">
                <input
                    type="number"
                    placeholder="Ilość"
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    className="border rounded p-2 w-1/2"
                    min={0}
                />
                <input
                    type="text"
                    placeholder="Jednostka"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="border rounded p-2 w-1/2"
                />
            </div>

            {/* 🔹 Pole daty + przycisk czyszczenia */}
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
                className="bg-blue-600 text-white rounded p-2 hover:bg-blue-700 transition"
            >
                Dodaj produkt
            </button>
        </form>
    );
}
