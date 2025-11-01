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
  const isExpired = (d?: string | null) => {
    if (!d) return false;
    const date = new Date(d);
    if (isNaN(date.getTime())) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  return (
    <>
      <ul className="divide-y">
        {items.map((item) => (
          <li key={item.id} className="flex items-center gap-3 py-2 text-sm">
            {/* Lewa kolumna */}
            <div className="min-w-0 flex-1">
              <span className="font-medium truncate block">{item.name}</span>
              {item.expiry_date && (
                <span
                  className={`text-xs mt-0.5 block ${isExpired(item.expiry_date) ? "text-red-600" : "text-gray-500"
                    }`}
                >
                  do: {item.expiry_date}
                </span>
              )}
            </div>

            {/* Środek: stepper */}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                aria-label="Zmniejsz"
                onClick={() => onQuantityChange(item.id, Math.max(0, item.quantity - 1))}
              >
                −
              </Button>
              <span className="tabular-nums">
                {item.quantity} {item.unit}
              </span>
              <Button
                variant="ghost"
                size="sm"
                aria-label="Zwiększ"
                onClick={() => onQuantityChange(item.id, item.quantity + 1)}
              >
                +
              </Button>
            </div>

            {/* Prawa: akcje */}
            <div className="flex items-center gap-1">
              <div className="hidden sm:flex gap-1">
                <Button variant="ghost" size="sm" aria-label="Edytuj" onClick={() => onEdit(item)} title="Edytuj">
                  ✏️
                </Button>
                <Button variant="ghost" size="sm" aria-label="Usuń" onClick={() => onDelete(item.id)} title="Usuń">
                  🗑
                </Button>
              </div>
              <div className="sm:hidden">
                {/* Na mobile też otwieramy JEDEN modal rodzica */}
                <Button variant="ghost" size="sm" aria-label="Więcej" onClick={() => onEdit(item)}>
                  ⋯
                </Button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
