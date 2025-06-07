import React, { useState } from "react";
import { useShoppingListStore } from "../../stores/shoppingListStore";
import Button from "../ui/Button";
import Input from "../ui/Input";

const AddListForm = () => {
    const [name, setName] = useState("");
    const addList = useShoppingListStore((state) => state.addList);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (name.trim()) {
            addList(name.trim());
            setName("");
        }
    };

    return (
        <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
                type="text"
                placeholder="Nazwa listy..."
                value={name}
                onChange={(e) => setName(e.target.value)}
            />
            <Button type="submit">Dodaj</Button>
        </form>
    );
};

export default AddListForm;
