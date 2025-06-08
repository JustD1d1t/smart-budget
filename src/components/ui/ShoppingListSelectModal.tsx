import { useEffect, useState } from "react";
import Button from "./Button";
import Modal from "./Modal"; // użycie Twojego komponentu
import { supabase } from "../../lib/supabaseClient";

type Props = {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (listId: string) => void;
};

export default function ShoppingListSelectModal({ isOpen, onClose, onSelect }: Props) {
    const [lists, setLists] = useState<{ id: string; name: string }[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!isOpen) return;

        const fetchLists = async () => {
            setLoading(true);
            const { data, error } = await supabase
                .from("shopping_lists")
                .select("id, name");

            if (!error && data) setLists(data);
            setLoading(false);
        };

        fetchLists();
    }, [isOpen]);

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Wybierz listę zakupową">
            <div className="space-y-4">
                {loading ? (
                    <p>Ładowanie...</p>
                ) : lists.length === 0 ? (
                    <p>Brak dostępnych list.</p>
                ) : (
                    lists.map((list) => (
                        <Button
                            key={list.id}
                            onClick={() => {
                                onSelect(list.id);
                                onClose();
                            }}
                            className="w-full"
                        >
                            {list.name}
                        </Button>
                    ))
                )}
                <Button onClick={onClose} className="w-full mt-4" variant="secondary">
                    Anuluj
                </Button>
            </div>
        </Modal>
    );
}
