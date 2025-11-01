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
    onItemAdded: (item: {
        id: string;
        name: string;
        category: string;
        quantity: number;
        unit: string;
        expiry_date?: string | null;
        ean?: string | null;
    }) => void;
};

const UNITS = ["szt", "kg"];

export default function AddPantryItemForm({ pantryId, onItemAdded }: Props) {
    const [name, setName] = useState("");
    const [category, setCategory] = useState("żywność");
    const [quantity, setQuantity] = useState<string>("1");
    const [unit, setUnit] = useState("szt");
    const [expiryDate, setExpiryDate] = useState("");
    const [ean, setEan] = useState("");

    const [nameError, setNameError] = useState("");
    const [categoryError, setCategoryError] = useState("");
    const [quantityError, setQuantityError] = useState("");
    const [unitError, setUnitError] = useState("");

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

    const validate = () => {
        let ok = true;
        const qty = parseFloat((quantity || "").replace(",", "."));

        if (!name.trim()) {
            setNameError("Nazwa produktu jest wymagana.");
            ok = false;
        } else setNameError("");

        if (!category) {
            setCategoryError("Wybierz kategorię.");
            ok = false;
        } else setCategoryError("");

        if (!quantity || isNaN(qty) || qty <= 0) {
            setQuantityError("Ilość musi być większa od zera.");
            ok = false;
        } else setQuantityError("");

        if (!unit) {
            setUnitError("Wybierz jednostkę.");
            ok = false;
        } else setUnitError("");

        return ok;
    };

    const handleSubmit = async () => {
        if (!validate()) return;

        const qty = parseFloat(quantity.replace(",", "."));

        try {
            let savedRow: any | null = null;

            if (ean) {
                // 1) Spróbuj znaleźć istniejący rekord w tej samej spiżarni z tym samym EAN
                const { data: existing, error: selErr } = await supabase
                    .from("pantry_items")
                    .select("id, quantity, unit, name, category, expiry_date, ean")
                    .eq("pantry_id", pantryId)
                    .eq("ean", ean)
                    .maybeSingle();

                if (selErr) {
                    console.error("Błąd SELECT by EAN:", selErr.message);
                }

                if (existing && existing.unit === unit) {
                    // 2a) MERGE: ta sama jednostka → sumujemy ilość (i opcjonalnie odświeżamy kategorię/datę)
                    const { data: updated, error: updErr } = await supabase
                        .from("pantry_items")
                        .update({
                            quantity: (existing.quantity ?? 0) + qty,
                            // opcjonalne „odświeżenia”:
                            category: category || existing.category,
                            // jeżeli podasz nową datę — ustaw; w przeciwnym razie zostaw istniejącą:
                            expiry_date: expiryDate ? expiryDate : existing.expiry_date ?? null,
                            // name zwykle zostawiamy istniejące, ale możesz podmienić jeśli chcesz:
                            // name: existing.name || name.trim(),
                        })
                        .eq("id", existing.id)
                        .select()
                        .single();

                    if (updErr) {
                        console.error("Błąd UPDATE merge by EAN:", updErr.message);
                        return;
                    }
                    savedRow = updated;
                } else if (existing && existing.unit !== unit) {
                    // 2b) Inna jednostka → dla bezpieczeństwa utwórz osobną pozycję
                    const { data: inserted, error: insErr } = await supabase
                        .from("pantry_items")
                        .insert({
                            pantry_id: pantryId,
                            name: name.trim(),
                            category,
                            quantity: qty,
                            unit,
                            expiry_date: expiryDate || null,
                            ean,
                        })
                        .select()
                        .single();

                    if (insErr) {
                        console.error("Błąd INSERT (unit mismatch):", insErr.message);
                        return;
                    }
                    savedRow = inserted;
                } else {
                    // 2c) Brak istniejącego → zwykły INSERT
                    const { data: inserted, error: insErr } = await supabase
                        .from("pantry_items")
                        .insert({
                            pantry_id: pantryId,
                            name: name.trim(),
                            category,
                            quantity: qty,
                            unit,
                            expiry_date: expiryDate || null,
                            ean,
                        })
                        .select()
                        .single();

                    if (insErr) {
                        console.error("Błąd INSERT:", insErr.message);
                        return;
                    }
                    savedRow = inserted;
                }

                // 3) Utrwal w katalogu EAN → nazwa/kategoria
                try {
                    await upsertCatalog(ean, name.trim(), category);
                } catch (e) {
                    console.warn("Nie udało się zaktualizować katalogu EAN:", e);
                }
            } else {
                // Bez EAN → zwykły INSERT
                const { data: inserted, error: insErr } = await supabase
                    .from("pantry_items")
                    .insert({
                        pantry_id: pantryId,
                        name: name.trim(),
                        category,
                        quantity: qty,
                        unit,
                        expiry_date: expiryDate || null,
                        ean: null,
                    })
                    .select()
                    .single();

                if (insErr) {
                    console.error("Błąd INSERT (no EAN):", insErr.message);
                    return;
                }
                savedRow = inserted;
            }

            if (savedRow) {
                onItemAdded(savedRow);
            }

            // reset pól
            setName("");
            setCategory("żywność");
            setQuantity("1");
            setUnit("szt");
            setExpiryDate("");
            setEan("");
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <div className="space-y-2">
            <div className="flex items-end gap-2">
                <Input
                    placeholder="Nazwa produktu"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    error={nameError}
                    className="flex-1"
                />
                <Button variant="outline" onClick={() => setScanOpen(true)}>
                    Skanuj EAN
                </Button>
            </div>

            {ean && (
                <p className="text-xs text-gray-500">
                    EAN: <span className="font-mono">{ean}</span>
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
                error={categoryError}
            />

            <div className="flex gap-2 items-start">
                <Input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value.replace(",", "."))}
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

            <Button onClick={handleSubmit} variant="primary">➕ Dodaj produkt</Button>

            {/* Modal skanera */}
            <EanScanner open={scanOpen} onClose={() => setScanOpen(false)} onDetected={handleDetectedEan} />
        </div>
    );
}
