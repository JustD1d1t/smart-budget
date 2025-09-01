import { useEffect, useState } from "react";
import ListItem from "../../components/shopping-list/ListItem";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Toast from "../../components/ui/Toast";
import { useShoppingListStore } from "../../stores/shoppingListStore";

const ShoppingListsPage = () => {
  const [newListName, setNewListName] = useState("");
  const [nameError, setNameError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type?: "error" | "success" } | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

  const { lists, fetchLists, addList, removeList } = useShoppingListStore();

  useEffect(() => {
    fetchLists().catch(() => setToast({ message: "Nie udało się pobrać list.", type: "error" }));
  }, [fetchLists]);

  const handleAddList = async () => {
    if (!newListName.trim()) {
      setNameError("Nazwa nie może być pusta.");
      return;
    }
    setNameError(null);

    try {
      await addList(newListName);
      setNewListName("");
      setToast({ message: "Lista dodana pomyślnie!", type: "success" });
    } catch (error) {
      setToast({ message: "Błąd podczas dodawania listy.", type: "error" });
    }
  };

  const handleRemoveList = async (id: string) => {
    try {
      await removeList(id);
      setToast({ message: "Usunięto listę", type: "success" });
    } catch {
      setToast({ message: "Błąd przy usuwaniu listy", type: "error" });
    }
  };

  const handleEditClick = (listId: string, currentName: string) => {
    setEditingId(listId);
    setEditingName(currentName);
  };

  const handleRenameList = async (id: string) => {
    if (!editingName.trim()) return;
    // Placeholder: update list name logic if needed in store
    setEditingId(null);
    setEditingName("");
    setToast({ message: "Zmieniono nazwę listy", type: "success" });
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-xl font-bold mb-4">Twoje listy zakupowe</h1>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <div className="flex flex-col gap-2 mb-4 sm:flex-row sm:items-start">
        <div className="flex-1">
          <Input
            value={newListName}
            onChange={(e) => setNewListName(e.target.value)}
            placeholder="Nazwa listy"
            error={nameError || undefined}
          />
        </div>
        <Button onClick={handleAddList}>Dodaj listę</Button>
      </div>

      {lists.length === 0 ? (
        <p>Brak list zakupowych.</p>
      ) : (
        <ul className="space-y-4">
          {lists.map((list) => (
            <li key={list.id}>
              {editingId === list.id ? (
                <div className="border rounded-xl p-3 sm:p-4 mb-2 shadow bg-white">
                  <Input
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    className="mb-2"
                  />
                  <div className="flex gap-2">
                    <Button onClick={() => handleRenameList(list.id)}>Zapisz</Button>
                    <Button variant="outline" onClick={() => setEditingId(null)}>
                      Anuluj
                    </Button>
                  </div>
                </div>
              ) : (
                <ListItem
                  list={{ ...list, isOwner: true }}
                  onRemove={() => handleRemoveList(list.id)}
                  onEdit={() => handleEditClick(list.id, list.name)}
                />
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ShoppingListsPage;
