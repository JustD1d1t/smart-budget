import { useState } from "react";
import Button from "../ui/Button";

type Item = {
    id: string;
    name: string;
    category: string;
    quantity: number;
    unit: string;
};

type Props = {
    items: Item[];
    onEdit: (item: Item) => void;
    onDelete: (id: string) => void;
};

export default function GroupedItemList({ items, onEdit, onDelete }: Props) {
    const grouped = items.reduce<Record<string, Item[]>>((acc, item) => {
        acc[item.category] = acc[item.category] || [];
        acc[item.category].push(item);
        return acc;
    }, {});

    const [openCategory, setOpenCategory] = useState<string | null>(null);

    return (
        <div className="space-y-4">
            {Object.entries(grouped).map(([category, items]) => (
                <div key={category} className="border rounded">
                    <button
                        className="w-full px-4 py-2 text-left font-semibold bg-gray-100"
                        onClick={() =>
                            setOpenCategory((prev) => (prev === category ? null : category))
                        }
                    >
                        {category} ({items.length})
                    </button>
                    {openCategory === category && (
                        <ul className="divide-y">
                            {items.map((item) => (
                                <li
                                    key={item.id}
                                    className="grid grid-cols-4 gap-2 p-2 items-center text-sm"
                                >
                                    <span>{item.name}</span>
                                    <span className="text-gray-500">
                                        {item.quantity} {item.unit}
                                    </span>
                                    <Button variant="ghost" onClick={() => onEdit(item)}>
                                        ✏️ Edytuj
                                    </Button>
                                    <Button variant="ghost" onClick={() => onDelete(item.id)}>
                                        🗑 Usuń
                                    </Button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            ))}
        </div>
    );
}
