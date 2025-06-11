import { PantryItem } from "../../types"; // albo przekaż bezpośrednio typ propsów
import Button from "../ui/Button";
import Input from "../ui/Input";
import Modal from "../ui/Modal"; // Twój własny wrapper modala
import Select from "../ui/Select";

type Props = {
    item: PantryItem;
    onChange: (item: PantryItem) => void;
    onSave: () => void;
    onClose: () => void;
};

const CATEGORIES = ["żywność", "chemia", "napoje", "mrożonki", "inne"];
const UNITS = ["szt", "kg"];

export default function EditPantryItemModal({
    item,
    onChange,
    onSave,
    onClose,
}: Props) {
    return (
        <Modal onClose={onClose}>
            <div className="space-y-2 bg-white max-w-md mx-auto">
                <h2 className="text-lg font-bold mb-2">✏️ Edytuj produkt</h2>

                <Input
                    value={item.name}
                    onChange={(e) => onChange({ ...item, name: e.target.value })}
                    placeholder="Nazwa produktu"
                />
                <Select
                    value={item.category}
                    onChange={(e) => onChange({ ...item, category: e.target.value })}
                    options={CATEGORIES}
                    placeholder="Kategoria"
                />
                <div className="flex gap-2">
                    <Input
                        type="number"
                        value={item.quantity}
                        onChange={(e) =>
                            onChange({ ...item, quantity: Number(e.target.value) })
                        }
                        placeholder="Ilość"
                    />
                    <Select
                        value={item.unit}
                        onChange={(e) => onChange({ ...item, unit: e.target.value })}
                        options={UNITS}
                        placeholder="Jednostka"
                    />
                </div>
                <Input
                    type="date"
                    value={item.expiry_date || ""}
                    onChange={(e) => onChange({ ...item, expiry_date: e.target.value || null })}
                />

                <div className="flex justify-end gap-2 mt-4">
                    <Button variant="ghost" onClick={onClose}>
                        Anuluj
                    </Button>
                    <Button onClick={onSave}>💾 Zapisz</Button>
                </div>
            </div>
        </Modal>
    );
}
