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
      {/* Nagłówek – widoczny zawsze, równo rozłożony */}
      <li
        className="
          grid grid-cols-3 gap-2 font-semibold text-sm text-left pb-2
          sm:grid-cols-6
        "
      >
        <span>Produkt</span>
        <span>Kategoria</span>
        <span className="text-center">Ilość</span>
        <span className="hidden sm:block sm:col-span-3"></span>
      </li>
      {items.map((item) => (
        <li
          key={item.id}
          className="
            grid grid-cols-3 gap-2 py-3
            sm:grid-cols-6 sm:items-center sm:text-left
            text-sm
          "
        >
          {/* Produkt */}
          <div className="min-w-0 flex flex-col">
            <span>{item.name}</span>
            {item.expiry_date && (
              <p className="text-xs text-gray-400">Do: {item.expiry_date}</p>
            )}
          </div>
          {/* Kategoria */}
          <span className="text-gray-500 italic min-w-0">{item.category}</span>
          {/* Ilość + +/- (wyśrodkowane!) */}
          <div className="flex items-center justify-center gap-2">
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
          {/* Przyciski Edytuj/Usuń – nowy wiersz, równa szerokość na mobile */}
          <div className="col-span-3 grid grid-cols-2 gap-2 mt-2 sm:col-span-3 sm:flex sm:justify-end sm:mt-0">
            <Button
              variant="ghost"
              className="w-full"
              onClick={() => onEdit(item)}
            >
              ✏️ Edytuj
            </Button>
            <Button
              variant="ghost"
              className="w-full"
              onClick={() => onDelete(item.id)}
            >
              🗑 Usuń
            </Button>
          </div>
        </li>
      ))}
    </ul>
  );
}
