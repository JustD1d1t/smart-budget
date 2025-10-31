import { PantryItem } from "../../types";
import { PANTRY_ITEMS_CATEGORIES } from "../../utils/categories";
import Button from "../ui/Button";
import Input from "../ui/Input";
import Modal from "../ui/Modal";
import Select from "../ui/Select";

type Props = {
    item: PantryItem;
    onChange: (item: PantryItem) => void;
    onSave: () => void;
    onClose: () => void;
    onQuantityChange: (id: string, newQty: number) => void | Promise<void>;
    onDelete: (id: string) => void | Promise<void>;
};

const UNITS = ["szt", "kg"];

export default function PantryItemModal({
    item,
    onChange,
    onSave,
    onClose,
    onQuantityChange,
    onDelete,
}: Props) {
    const dec = () => {
        const newQty = Math.max(0, (item.quantity ?? 0) - 1);
        onChange({ ...item, quantity: newQty });
        onQuantityChange(item.id, newQty); // natychmiastowy persist stepera
    };
    const inc = () => {
        const newQty = (item.quantity ?? 0) + 1;
        onChange({ ...item, quantity: newQty });
        onQuantityChange(item.id, newQty); // natychmiastowy persist stepera
    };

    const canSubmit =
        item.name?.trim() &&
        item.category?.trim() &&
        Number.isFinite(item.quantity) &&
        item.quantity > 0 &&
        item.unit?.trim();

    return (
        <Modal onClose={onClose}>
            <div className="space-y-4 bg-white max-w-md mx-auto">
                {/* Nagłówek + szybkie akcje *w tym samym widoku* */}
                <div className="space-y-1">
                    <h2 className="text-lg font-bold">{item.name || "Produkt"}</h2>
                    <p className="text-xs text-gray-500">
                        {item.category || "—"}
                        {item.expiry_date ? ` • do: ${item.expiry_date}` : ""}
                    </p>
                </div>

                {/* Szybkie +/- ilości (od razu uaktualnia back i formularz) */}
                <div className="flex items-center justify-between rounded-lg border p-2">
                    <span className="text-sm">Ilość</span>
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" onClick={dec}>−</Button>
                        <span className="text-sm tabular-nums">
                            {item.quantity} {item.unit}
                        </span>
                        <Button variant="ghost" size="sm" onClick={inc}>+</Button>
                    </div>
                </div>

                {/* Formularz edycji – widoczny cały czas */}
                <div className="space-y-2">
                    <Input
                        value={item.name}
                        onChange={(e) => onChange({ ...item, name: e.target.value })}
                        placeholder="Nazwa produktu"
                    />
                    <Select
                        value={item.category}
                        onChange={(e) => onChange({ ...item, category: e.target.value })}
                        options={PANTRY_ITEMS_CATEGORIES}
                        placeholder="Kategoria"
                        aria-label="Kategoria"
                    />
                    <div className="flex gap-2">
                        <Input
                            type="number"
                            value={item.quantity}
                            onChange={(e) =>
                                onChange({ ...item, quantity: Number(e.target.value) })
                            }
                            placeholder="Ilość"
                            min={0}
                            step={1}
                        />
                        <Select
                            value={item.unit}
                            onChange={(e) => onChange({ ...item, unit: e.target.value })}
                            options={UNITS}
                            placeholder="Jednostka"
                            aria-label="Jednostka"
                        />
                    </div>
                    <Input
                        type="date"
                        value={item.expiry_date || ""}
                        onChange={(e) =>
                            onChange({ ...item, expiry_date: e.target.value || null })
                        }
                    />
                </div>

                {/* Akcje dolne */}
                <div className="grid grid-cols-2 gap-2">
                    <Button
                        variant="ghost"
                        className="w-full"
                        onClick={() => onDelete(item.id)}
                    >
                        🗑 Usuń
                    </Button>
                    <div className="flex justify-end gap-2">
                        <Button variant="ghost" onClick={onClose}>
                            Anuluj
                        </Button>
                        <Button disabled={!canSubmit} onClick={onSave}>
                            💾 Zapisz
                        </Button>
                    </div>
                </div>
            </div>
        </Modal>
    );
}
