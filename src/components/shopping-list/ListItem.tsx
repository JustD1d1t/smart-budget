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
}

const ListItem = ({ list, onRemove }: Props) => {
  const navigate = useNavigate();

  return (
    <div className="border rounded p-4">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-lg font-semibold">{list.name}</h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate(`/shopping-lists/${list.id}`)}>
            Otwórz
          </Button>
          {onRemove && (
            <Button variant="danger" onClick={() => onRemove(list.id)}>
              Usuń
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ListItem;
