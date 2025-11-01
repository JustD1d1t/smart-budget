import { useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { CATEGORIES } from "../../utils/categories";
import Button from "../ui/Button";
import Input from "../ui/Input";
import Select from "../ui/Select";

type Props = {
    pantryId: string;
    onItemAdded: (item: {
        id: string;
        name: string;
        category: string;
        quantity: number;
        unit: string;
        expiry_date?: string | null;
    }) => void;
};

const UNITS = ["szt", "kg"];

export default function AddPantryItemForm({ pantryId, onItemAdded }: Props) {
    const [name, setName] = useState("");
    const [category, setCategory] = useState("żywność");
    const [quantity, setQuantity] = useState<string>("1"); // teraz string, by móc przechowywać "" (pusty)
    const [unit, setUnit] = useState("szt");
    const [expiryDate, setExpiryDate] = useState("");

    const [nameError, setNameError] = useState("");
    const [categoryError, setCategoryError] = useState("");
    const [quantityError, setQuantityError] = useState("");
    const [unitError, setUnitError] = useState("");

    const handleSubmit = async () => {
        let isValid = true;

        const numericQty = parseFloat(quantity.replace(",", ".")); // konwersja z przecinkiem

        if (!name.trim()) {
            setNameError("Nazwa produktu jest wymagana.");
            isValid = false;
        } else {
            setNameError("");
        }

        if (!category) {
            setCategoryError("Wybierz kategorię.");
            isValid = false;
        } else {
            setCategoryError("");
        }

        if (!quantity || isNaN(numericQty) || numericQty <= 0) {
            setQuantityError("Ilość musi być większa od zera.");
            isValid = false;
        } else {
            setQuantityError("");
        }

        if (!unit) {
            setUnitError("Wybierz jednostkę.");
            isValid = false;
        } else {
            setUnitError("");
        }

        if (!isValid) return;

        const { data, error } = await supabase
            .from("pantry_items")
            .insert({
                pantry_id: pantryId,
                name: name.trim(),
                category,
                quantity: numericQty,
                unit,
                expiry_date: expiryDate || null,
            })
            .select()
            .single();

        if (error) {
            console.error("Błąd dodawania produktu:", error.message);
            return;
        }

        // 🔹 Najpierw zapis w Supabase, dopiero potem w store
        onItemAdded(data);

        // reset pól
        setName("");
        setCategory("żywność");
        setQuantity("1");
        setUnit("szt");
        setExpiryDate("");
    };

    return (
        <div className="space-y-2">
            <Input
                placeholder="Nazwa produktu"
                value={name}
                onChange={(e) => setName(e.target.value)}
                error={nameError}
            />

            <Select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                options={CATEGORIES}
                placeholder="Wybierz kategorię"
                error={categoryError}
            />

            <div className="flex gap-2 items-start">
                <Input
                    type="number"
                    value={quantity}
                    onChange={(e) => {
                        const val = e.target.value.replace(",", ".");
                        setQuantity(val);
                    }}
                    placeholder="Ilość"
                    error={quantityError}
                    className="w-1/2"
                />
                <Select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    options={UNITS}
                    placeholder="-- wybierz jednostkę --"
                    error={unitError}
                    className="w-1/2"
                />
            </div>

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

            <Button onClick={handleSubmit}>➕ Dodaj produkt</Button>
        </div>
    );
}
