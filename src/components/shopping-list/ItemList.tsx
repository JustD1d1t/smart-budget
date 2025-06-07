import React from "react";

interface ShoppingItem {
    id: string;
    name: string;
    category: string;
    quantity: number;
    unit: string;
    bought: boolean;
}

interface Props {
    items: ShoppingItem[];
    onToggle: (itemId: string, current: boolean) => void;
    onEdit: (item: ShoppingItem) => void;
}

const ItemList: React.FC<Props> = ({ items, onToggle, onEdit }) => {
    return (
        <ul className="space-y-2">
            {items.map((item) => (
                <li key={item.id} className="flex justify-between items-center">
                    <div
                        onClick={() => onToggle(item.id, item.bought)}
                        className="cursor-pointer flex gap-2"
                    >
                        <input type="checkbox" checked={item.bought} readOnly />
                        <span className={item.bought ? "line-through text-gray-500" : ""}>
                            {item.name} ({item.category}) - {item.quantity} {item.unit}
                        </span>
                    </div>
                    <button
                        className="text-sm text-blue-500 hover:underline"
                        onClick={() => onEdit(item)}
                    >
                        Edytuj
                    </button>
                </li>
            ))}
        </ul>
    );
};

export default ItemList;
