import { useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import Button from "../ui/Button";
import Input from "../ui/Input";

interface Props {
    listId: string;
    onItemAdded?: (item: any) => void;
}

const AddItemForm = ({ listId, onItemAdded }: Props) => {
    const [name, setName] = useState("");
    const [quantity, setQuantity] = useState("");
    const [unit, setUnit] = useState("szt");
    const [errors, setErrors] = useState<{ name?: string; quantity?: string }>({});

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const newErrors: typeof errors = {};

        if (!name.trim()) newErrors.name = "Podaj nazwę produktu.";
        if (!quantity.trim()) newErrors.quantity = "Podaj ilość.";

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setErrors({});

        try {
            const { data, error } = await supabase
                .from("shopping_items")
                .insert({
                    list_id: listId,
                    name,
                    quantity: Number(quantity),
                    unit,
                    bought: false,
                })
                .select()
                .single();

            if (error) throw error;

            setName("");
            setQuantity("");
            setUnit("szt");
            onItemAdded?.(data);
        } catch (err) {
            console.error("Błąd przy dodawaniu produktu:", err);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-2" noValidate>
            <Input
                placeholder="Nazwa"
                value={name}
                onChange={(e) => setName(e.target.value)}
                error={errors.name}
            />
            <Input
                placeholder="Ilość"
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                error={errors.quantity}
            />
            <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full p-2 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-black"
            >
                <option value="szt">szt</option>
                <option value="kg">kg</option>
                <option value="g">g</option>
                <option value="l">l</option>
                <option value="ml">ml</option>
            </select>
            <Button type="submit">Dodaj produkt</Button>
        </form>
    );
};

export default AddItemForm;
