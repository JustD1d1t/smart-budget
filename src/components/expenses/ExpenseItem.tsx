import { useState } from "react";
import { Expense } from "../../pages/expenses/ExpensesListPage";
import Button from "../ui/Button";
import ConfirmModal from "../ui/ConfirmModal";

type Props = {
    expense: Expense;
    onPreview?: (id: string) => void;
    onEdit?: (id: string) => void;
    onDelete?: (id: string) => void;
};

export default function ExpenseItem({ expense, onPreview, onEdit, onDelete }: Props) {
    const hasActions = Boolean(onPreview || onEdit || onDelete);
    const [confirmOpen, setConfirmOpen] = useState(false);

    const askDelete = () => setConfirmOpen(true);

    const handleConfirmDelete = async () => {
        await onDelete?.(expense.id);
        setConfirmOpen(false);
    };

    return (
        <li className="grid grid-cols-4 gap-2 py-3 text-sm items-center">
            <span>{expense.store}</span>
            <span>{expense.amount.toFixed(2)} zł</span>
            <span className="text-gray-500">{expense.date}</span>
            <span className="text-gray-400 italic">{expense.category}</span>

            {hasActions && (
                <div className="col-span-4 mt-2 flex gap-2 sm:col-span-1 sm:mt-0 sm:justify-end">
                    {onPreview && (
                        <Button onClick={() => onPreview(expense.id)} className="text-xs" variant="outline">
                            👁️ Podgląd
                        </Button>
                    )}
                    {onEdit && (
                        <Button onClick={() => onEdit(expense.id)} className="text-xs">
                            ✏️ Edytuj
                        </Button>
                    )}
                    {onDelete && (
                        <Button onClick={askDelete} className="text-xs" variant="danger">
                            🗑 Usuń
                        </Button>
                    )}
                </div>
            )}

            {onDelete && (
                <ConfirmModal
                    open={confirmOpen}
                    onClose={() => setConfirmOpen(false)}
                    variant="critical"
                    title="Usunąć wydatek?"
                    description={
                        <>
                            Tej operacji nie można cofnąć.
                            <br />
                            <span className="text-gray-600">
                                <strong>Sklep:</strong> {expense.store} • <strong>Kwota:</strong>{" "}
                                {expense.amount.toFixed(2)} zł • <strong>Data:</strong> {expense.date}
                            </span>
                        </>
                    }
                    confirmText="Usuń"
                    cancelText="Anuluj"
                    disableBackdropClose
                    onConfirm={handleConfirmDelete}
                />
            )}
        </li>
    );
}
