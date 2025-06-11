import Button from "../ui/Button";

type Item = {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  expiry_date?: string | null;
};

type Props = {
  items: Item[];
  onEdit: (item: Item) => void;
  onDelete: (id: string) => void;
  onQuantityChange: (id: string, newQuantity: number) => void;
};

export default function ItemList({ items, onEdit, onDelete, onQuantityChange }: Props) {
  return (
    <ul className="divide-y">
      <li className="grid grid-cols-6 gap-2 font-semibold text-sm text-left pb-2">
        <span>Produkt</span>
        <span>Kategoria</span>
        <span>Ilość</span>
        <span colSpan={3}></span>
      </li>
      {items.map((item) => (
        <li
          key={item.id}
          className="py-3 grid grid-cols-6 gap-2 text-sm text-left items-center"
        >
          <div>
            <span>{item.name}</span>
            {item.expiry_date && (
              <p className="text-xs text-gray-400">Do: {item.expiry_date}</p>
            )}
          </div>

          <span className="text-gray-500 italic">{item.category}</span>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onQuantityChange(item.id, Math.max(0, item.quantity - 1))}
            >
              ➖
            </Button>
            <span className="text-gray-700">
              {item.quantity} {item.unit}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onQuantityChange(item.id, item.quantity + 1)}
            >
              ➕
            </Button>
          </div>

          <Button variant="ghost" onClick={() => onEdit(item)}>
            ✏️ Edytuj
          </Button>

          <Button variant="ghost" onClick={() => onDelete(item.id)}>
            🗑 Usuń
          </Button>
        </li>
      ))}
    </ul>
  );
}
