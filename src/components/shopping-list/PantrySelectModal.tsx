import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import Button from "../ui/Button";
import Modal from "../ui/Modal";

type Pantry = { id: string; name: string };

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (pantryId: string) => void;
}

const PantrySelectModal = ({ isOpen, onClose, onSelect }: Props) => {
    const [pantries, setPantries] = useState<Pantry[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!isOpen) return;

        const fetchPantries = async () => {
            setLoading(true);
            const { data, error } = await supabase.from("pantries").select("id, name");
            if (!error && data) setPantries(data);
            setLoading(false);
        };

        fetchPantries();
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <Modal onClose={onClose} title="Wybierz spiżarnię">
            <div className="space-y-4">
                {loading ? (
                    <p>Ładowanie...</p>
                ) : (
                    pantries.map((pantry) => (
                        <Button
                            key={pantry.id}
                            className="w-full"
                            onClick={() => {
                                onSelect(pantry.id);
                                onClose();
                            }}
                        >
                            {pantry.name}
                        </Button>
                    ))
                )}
            </div>
        </Modal>
    );
};

export default PantrySelectModal;
