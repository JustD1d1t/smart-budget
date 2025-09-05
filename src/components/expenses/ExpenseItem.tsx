import { Expense } from "../../pages/expenses/ExpensesListPage";
import Button from "../ui/Button";

type Props = {
    expense: Expense;
    onPreview?: (id: string) => void;
    onEdit?: (id: string) => void;
    onDelete?: (id: string) => void;
};

export default function ExpenseItem({ expense, onPreview, onEdit, onDelete }: Props) {
    const hasActions = Boolean(onPreview || onEdit || onDelete);

    return (
        <li className="grid grid-cols-4 gap-2 py-3 text-sm items-center">
            <span>{expense.store}</span>
            <span>{expense.amount.toFixed(2)} zł</span>
            <span className="text-gray-500">{expense.date}</span>
            <span className="text-gray-400 italic">{expense.category}</span>

            {hasActions && (
                <div className="col-span-4 mt-2 flex gap-2 sm:col-span-1 sm:mt-0 sm:justify-end">
                    {onPreview && (
                        <Button onClick={() => onPreview(expense.id)} className="text-xs">
                            👁️ Podgląd
                        </Button>
                    )}
                    {onEdit && (
                        <Button onClick={() => onEdit(expense.id)} className="text-xs">
                            ✏️ Edytuj
                        </Button>
                    )}
                    {onDelete && (
                        <Button onClick={() => onDelete(expense.id)} className="text-xs" variant="danger">
                            🗑 Usuń
                        </Button>
                    )}
                </div>
            )}
        </li>
    );
}
