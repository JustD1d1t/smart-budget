import Button from "../ui/Button";
import Input from "../ui/Input";
import Modal from "../ui/Modal";
import Select from "../ui/Select";

type Item = {
  id: string;
  name: string;
  quantity: number;
  unit: string;
};

type Props = {
  item: Item;
  onChange: (item: Item) => void;
  onClose: () => void;
  onSave: () => void;
};

const UNITS = ["szt", "kg", "l", "opak", "g"];

export default function EditItemModal({ item, onChange, onClose, onSave }: Props) {
  return (
    <Modal onClose={onClose}>
      <div className="space-y-4 w-full">
        <h2 className="text-lg font-semibold">Edytuj produkt</h2>

        <Input
          value={item.name}
          onChange={(e) => onChange({ ...item, name: e.target.value })}
          placeholder="Nazwa produktu"
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

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Anuluj
          </Button>
          <Button onClick={onSave}>Zapisz</Button>
        </div>
      </div>
    </Modal>
  );
}
