import { useState } from "react";
import { useEanLookup } from "../../hooks/useEanLookup";
import { supabase } from "../../lib/supabaseClient";
import { CATEGORIES } from "../../utils/categories";
import Button from "../ui/Button";
import Input from "../ui/Input";
import Select from "../ui/Select";
import EanScanner from "../utilities/EanScanner";

type Props = {
    pantryId: string;
    onItemAdded: (item: any) => void;
};

const UNITS = ["szt", "kg"];

export default function AddPantryItemForm({ pantryId, onItemAdded }: Props) {
    const [name, setName] = useState("");
    const [category, setCategory] = useState("żywność");
    const [quantity, setQuantity] = useState("1");
    const [unit, setUnit] = useState("szt");
    const [expiryDate, setExpiryDate] = useState("");
    const [ean, setEan] = useState("");
    const [scanOpen, setScanOpen] = useState(false);

    const { lookupByEan, upsertCatalog } = useEanLookup();

    const handleDetectedEan = async (code: string) => {
        setEan(code);
        setScanOpen(false);
        try {
            const product = await lookupByEan(code);
            if (product) {
                if (product.name) setName(product.name);
                if (product.category) setCategory(product.category);
            }
        } catch (e) {
            console.warn("Lookup EAN błąd:", e);
        }
    };

    const handleSubmit = async () => {
        const qty = parseFloat(quantity.replace(",", "."));
        if (!name.trim() || !qty || qty <= 0) return;

        const { data, error } = await supabase
            .from("pantry_items")
            .insert({
                pantry_id: pantryId,
                name: name.trim(),
                category,
                quantity: qty,
                unit,
                expiry_date: expiryDate || null,
                ean: ean || null,
            })
            .select()
            .single();

        if (error) {
            console.error(error.message);
            return;
        }

        if (ean) {
            try {
                await upsertCatalog(ean, name.trim(), category);
            } catch (e) {
                console.warn("Błąd katalogu EAN:", e);
            }
        }

        onItemAdded(data);
        setName("");
        setCategory("żywność");
        setQuantity("1");
        setUnit("szt");
        setExpiryDate("");
        setEan("");
    };

    return (
        <div className="space-y-2">
            <div className="flex items-end gap-2">
                <Input
                    placeholder="Nazwa produktu"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="flex-1"
                />
                <Button variant="outline" onClick={() => setScanOpen(true)}>
                    Skanuj EAN
                </Button>
            </div>

            {ean && (
                <p className="text-xs text-gray-500">
                    EAN: <span className="font-mono">{ean}</span>{" "}
                    <Button variant="ghost" className="ml-2 px-2 py-0.5" onClick={() => setEan("")}>
                        ✕
                    </Button>
                </p>
            )}

            <Select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                options={CATEGORIES}
                placeholder="Wybierz kategorię"
            />

            <div className="flex gap-2">
                <Input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    placeholder="Ilość"
                    className="w-1/2"
                />
                <Select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    options={UNITS}
                    placeholder="Jednostka"
                    className="w-1/2"
                />
            </div>

            <div className="flex items-center gap-2">
                <input
                    type="date"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    className="border rounded p-2 flex-1"
                />
                {expiryDate && (
                    <button
                        type="button"
                        onClick={() => setExpiryDate("")}
                        className="px-2 py-1 text-gray-500 hover:text-black border rounded"
                    >
                        ✕
                    </button>
                )}
            </div>

            <Button onClick={handleSubmit}>➕ Dodaj produkt</Button>

            <EanScanner open={scanOpen} onClose={() => setScanOpen(false)} onDetected={handleDetectedEan} />
        </div>
    );
}
