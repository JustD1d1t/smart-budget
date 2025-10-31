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
            {/* Lewa kolumna: nazwa + data ważności pod spodem */}
            <div className="min-w-0 flex-1">
              <span className="font-medium truncate block">{item.name}</span>
              {item.expiry_date && (
                <span
                  className={`text-xs mt-0.5 block ${isExpired(item.expiry_date)
                      ? "text-red-600"
                      : "text-gray-500"
                    }`}
                >
                  do: {item.expiry_date}
                </span>
              )}
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

            {/* Prawa: akcje */}
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

      {/* Modal akcji dla mobile */}
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
