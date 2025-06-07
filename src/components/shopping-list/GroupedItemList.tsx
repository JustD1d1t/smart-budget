import React from "react";
import Accordion from "../ui/Accordion";

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
    filterCategory: string;
    onToggle: (itemId: string, current: boolean) => void;
    onEdit: (item: ShoppingItem) => void;
}

const GroupedItemList: React.FC<Props> = ({ items, filterCategory, onToggle, onEdit }) => {
    const categories = [...new Set(items.map((item) => item.category))];

    return (
        <>
            {categories
                .filter((cat) => filterCategory === "all" || cat === filterCategory)
                .map((cat) => (
                    <Accordion key={cat} title={cat}>
                        <ul className="space-y-2">
                            {items
                                .filter((item) => item.category === cat)
                                .map((item) => (
                                    <li key={item.id} className="flex justify-between items-center">
                                        <div
                                            onClick={() => onToggle(item.id, item.bought)}
                                            className="cursor-pointer flex gap-2"
                                        >
                                            <input type="checkbox" checked={item.bought} readOnly />
                                            <span className={item.bought ? "line-through text-gray-500" : ""}>
                                                {item.name} ({item.quantity} {item.unit})
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
                    </Accordion>
                ))}
        </>
    );
};

export default GroupedItemList;
