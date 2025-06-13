import { Expense } from "../../pages/expenses/ExpensesListPage";
import Button from "../ui/Button";

type Props = {
    expense: Expense;
    onEdit: (id: string) => void;
    onDelete: (id: string) => void;
};

export default function ExpenseItem({ expense, onEdit, onDelete }: Props) {
    return (
        <li className="grid grid-cols-4 gap-2 py-3 text-sm items-center">
            <span>{expense.store}</span>
            <span>{expense.amount.toFixed(2)} zł</span>
            <span className="text-gray-500">{expense.date}</span>
            <span className="text-gray-400 italic">{expense.category}</span>
            {/* Przyciski możesz zrobić jako popover/menu, lub wyświetlić pod spodem albo na hover na mobile */}
            {(onEdit || onDelete) && (
                <div className="col-span-4 flex gap-2 mt-2 sm:col-span-1 sm:mt-0 sm:justify-end">
                    {onEdit && (
                        <Button onClick={() => onEdit(expense.id)} className="text-xs">
                            ✏️ Edytuj
                        </Button>
                    )}
                    {onDelete && (
                        <Button onClick={() => onDelete(expense.id)} className="text-xs">
                            🗑 Usuń
                        </Button>
                    )}
                </div>
            )}
        </li>
    );
}

