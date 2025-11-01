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

// prosta normalizacja: małe litery + usunięcie znaków diakrytycznych
function normalizeName(s: string) {
    return (s || "")
        .toString()
        .trim()
        .toLowerCase()
        .normalize("NFD")
        // @ts-ignore – regex unicode char class
        .replace(/\p{Diacritic}/gu, "");
}

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
        const targetName = name.trim();
        const normTarget = normalizeName(targetName);

        try {
            // --- MERGE PO NAZWIE (ta sama spiżarnia) ---
            // 1) Spróbuj znaleźć potencjalne dopasowania (ilike: bez rozróżniania wielkości liter)
            //    Używam ilike na dokładnej nazwie; jeśli nic nie znajdzie, dorobię fallback z %...% i match po normalize.
            let candidate: any | null = null;

            // próba: case-insensitive exact (bez diakrytyków to i tak sprawdzimy niżej)
            const { data: exactList, error: exactErr } = await supabase
                .from("pantry_items")
                .select("id, name, quantity, unit, category, expiry_date, ean")
                .eq("pantry_id", pantryId)
                .ilike("name", targetName)
                .limit(5);

            if (exactErr) {
                console.error("Błąd SELECT exact by name:", exactErr.message);
            }

            // wybierz ten z dokładnym „normalize” (żeby 'Mléko' == 'mleko')
            if (exactList && exactList.length) {
                candidate =
                    exactList.find((row) => normalizeName(row.name) === normTarget) || exactList[0];
            }

            // fallback: łagodniejsze wyszukiwanie — kilka wierszy z podobną nazwą, a potem match po normalize
            if (!candidate) {
                const { data: softList, error: softErr } = await supabase
                    .from("pantry_items")
                    .select("id, name, quantity, unit, category, expiry_date, ean")
                    .eq("pantry_id", pantryId)
                    .ilike("name", `%${targetName}%`)
                    .limit(20);

                if (softErr) {
                    console.error("Błąd SELECT soft by name:", softErr.message);
                } else if (softList && softList.length) {
                    const found = softList.find((row) => normalizeName(row.name) === normTarget);
                    if (found) candidate = found;
                }
            }

            let savedRow: any | null = null;

            if (candidate && candidate.unit === unit) {
                // 2a) Ta sama jednostka → sumuj ilość
                const { data: updated, error: updErr } = await supabase
                    .from("pantry_items")
                    .update({
                        quantity: (candidate.quantity ?? 0) + qty,
                        // opcjonalnie odśwież kategorię i datę ważności:
                        category: category || candidate.category,
                        expiry_date: expiryDate ? expiryDate : candidate.expiry_date ?? null,
                        // ean zostawiam istniejący lub ustaw, jeśli nowy dostarczono a brak w bazie:
                        ean: candidate.ean ?? (ean || null),
                    })
                    .eq("id", candidate.id)
                    .select()
                    .single();

                if (updErr) {
                    console.error("Błąd UPDATE merge by name:", updErr.message);
                    return;
                }
                savedRow = updated;
            } else {
                // 2b) Brak dopasowania po nazwie LUB inna jednostka → wstaw nowy rekord
                const { data: inserted, error: insErr } = await supabase
                    .from("pantry_items")
                    .insert({
                        pantry_id: pantryId,
                        name: targetName,
                        category,
                        quantity: qty,
                        unit,
                        expiry_date: expiryDate || null,
                        ean: ean || null,
                    })
                    .select()
                    .single();

                if (insErr) {
                    console.error("Błąd INSERT:", insErr.message);
                    return;
                }
                savedRow = inserted;
            }

            // 3) Utrwal mapowanie EAN -> nazwa/kategoria (jeśli mamy EAN)
            if (ean) {
                try {
                    await upsertCatalog(ean, targetName, category);
                } catch (e) {
                    console.warn("Nie udało się zaktualizować katalogu EAN:", e);
                }
            }

            if (savedRow) onItemAdded(savedRow);

            // reset
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
