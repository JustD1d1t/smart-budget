import Modal from "../ui/Modal";
import AddPantryItemForm from "./AddPantryItemForm";

interface AddPantryItemModalProps {
    pantryId: string;
    onClose: () => void;
    onItemAdded: (item: any) => void;
}

export default function AddPantryItemModal({
    pantryId,
    onClose,
    onItemAdded,
}: AddPantryItemModalProps) {
    return (
        <Modal onClose={onClose}>
            <h2 className="text-lg font-semibold mb-4">Dodaj produkt</h2>
            <AddPantryItemForm pantryId={pantryId} onItemAdded={(item) => {
                onItemAdded(item);
                onClose();
            }} />
        </Modal>
    );
}