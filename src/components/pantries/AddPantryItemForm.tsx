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
    const [category, setCategory] = useState("");
    const [quantity, setQuantity] = useState(1);
    const [unit, setUnit] = useState("");
    const [expiryDate, setExpiryDate] = useState("");

    const [nameError, setNameError] = useState("");
    const [categoryError, setCategoryError] = useState("");
    const [quantityError, setQuantityError] = useState("");
    const [unitError, setUnitError] = useState("");

    const handleSubmit = async () => {
        let isValid = true;

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

        if (quantity <= 0) {
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
                quantity,
                unit,
                expiry_date: expiryDate || null,
            })
            .select()
            .single();

        if (error) {
            console.error("Błąd dodawania produktu:", error.message);
        } else {
            onItemAdded(data);
            setName("");
            setCategory("");
            setQuantity(1);
            setUnit("");
            setExpiryDate("");
        }
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
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    placeholder="Ilość"
                    error={quantityError}
                />
                <Select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    options={UNITS}
                    placeholder="-- wybierz jednostkę --"
                    error={unitError}
                />
            </div>

            <Input
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                placeholder="Data przydatności (opcjonalna)"
            />

            <Button onClick={handleSubmit}>➕ Dodaj produkt</Button>
        </div>
    );
}
