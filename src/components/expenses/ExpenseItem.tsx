import { Expense } from "../../pages/expenses/ExpensesListPage";
import Button from "../ui/Button";

type Props = {
    expense: Expense;
    onEdit: (id: string) => void;
    onDelete: (id: string) => void;
};

export default function ExpenseItem({ expense, onEdit, onDelete }: Props) {
    return (
        <li className="py-3 grid grid-cols-6 gap-2 text-sm text-left items-center">
            <span>{expense.store}</span>
            <span>{expense.amount.toFixed(2)} zł</span>
            <span className="text-gray-500">{expense.date}</span>
            <span className="text-gray-400 italic">{expense.category}</span>
            {onEdit && <Button onClick={() => onEdit(expense.id)}>✏️ Edytuj</Button>}
            {onDelete && <Button onClick={() => onDelete(expense.id)}>🗑 Usuń</Button>}
        </li>
    );
}
