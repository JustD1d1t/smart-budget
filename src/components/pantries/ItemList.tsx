import { useState } from "react";
import Button from "../ui/Button";
import PantryItemModal from "./PantryItemModal";

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
  const [activeItem, setActiveItem] = useState<Item | null>(null);

  const openActions = (item: Item) => setActiveItem(item);
  const closeActions = () => setActiveItem(null);

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
          <li
            key={item.id}
            className="flex items-center gap-3 py-2 text-sm"
          >
            {/* Lewa kolumna: nazwa + metadane w jednej linii */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium truncate">{item.name}</span>
                {/* Chip kategorii */}
                <span className="shrink-0 rounded-full px-2 py-0.5 text-xs bg-gray-100 text-gray-600">
                  {item.category}
                </span>
                {/* Termin (koloruje, gdy po terminie) */}
                {item.expiry_date && (
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-xs ${isExpired(item.expiry_date)
                      ? "bg-red-100 text-red-700"
                      : "bg-emerald-100 text-emerald-700"
                      }`}
                    title="Data ważności"
                  >
                    do: {item.expiry_date}
                  </span>
                )}
              </div>
            </div>

            {/* Środek: kompaktowy stepper */}
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

            {/* Prawa: akcje – na desktopie ikonki; na mobile menu ⋯ */}
            <div className="flex items-center gap-1">
              <div className="hidden sm:flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  aria-label="Edytuj"
                  onClick={() => onEdit(item)}
                  title="Edytuj"
                >
                  ✏️
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  aria-label="Usuń"
                  onClick={() => onDelete(item.id)}
                  title="Usuń"
                >
                  🗑
                </Button>
              </div>
              <div className="sm:hidden">
                <Button
                  variant="ghost"
                  size="sm"
                  aria-label="Więcej"
                  onClick={() => openActions(item)}
                >
                  ⋯
                </Button>
              </div>
            </div>
          </li>
        ))}
      </ul>

      {/* Modal akcji dla mobile (i jako fallback) */}
      {activeItem && (
        <PantryItemModal
          view="actions"
          item={activeItem}
          onChange={(updated) => setActiveItem(updated)}
          onSave={() => {
            onEdit(activeItem);
            closeActions();
          }}
          onClose={closeActions}
          onQuantityChange={onQuantityChange}
          onDelete={(id) => {
            onDelete(id);
            closeActions();
          }}
        />
      )}
    </>
  );
}
