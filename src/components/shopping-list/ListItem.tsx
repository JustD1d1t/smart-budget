import { useNavigate } from "react-router-dom";
import Button from "../ui/Button";

interface ShoppingList {
  id: string;
  name: string;
  isOwner: boolean;
}

interface Props {
  list: ShoppingList;
  onRemove?: (id: string) => void;
  onEdit?: (list: ShoppingList) => void;
}

const ListItem = ({ list, onRemove, onEdit }: Props) => {
  const navigate = useNavigate();

  return (
    <div className="border rounded-xl p-3 sm:p-4 mb-2 shadow bg-white">
      {/* Układ mobile: kolumna, desktop: rząd */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <h2 className="text-base sm:text-lg font-semibold break-words">
          {list.name}
        </h2>
        {/* Przyciski – pod nazwą na mobile, obok na desktopie */}
        <div className="flex flex-row sm:flex-row gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            onClick={() => navigate(`/shopping-lists/${list.id}`)}
            className="w-full sm:w-auto"
          >
            Otwórz
          </Button>
          {onEdit && (
            <Button
              variant="primary"
              onClick={() => onEdit(list)}
              className="w-full sm:w-auto"
            >
              Edytuj
            </Button>
          )}
          {onRemove && (
            <Button
              variant="danger"
              onClick={() => onRemove(list.id)}
              className="w-full sm:w-auto"
            >
              Usuń
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ListItem;
