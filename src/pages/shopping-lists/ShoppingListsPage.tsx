import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import ListItem from "../../components/shopping-list/ListItem";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Toast from "../../components/ui/Toast";
import { supabase } from "../../lib/supabaseClient";

interface ShoppingList {
  id: string;
  name: string;
  isOwner: boolean;
}

const ShoppingListsPage = () => {
  const [lists, setLists] = useState<ShoppingList[]>([]);
  const [loading, setLoading] = useState(true);
  const [newListName, setNewListName] = useState("");
  const [nameError, setNameError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type?: "error" | "success" } | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const navigate = useNavigate();

  const fetchLists = async () => {
    setLoading(true);
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user?.id;

    const { data: listData, error } = await supabase
      .from("shopping_lists")
      .select("id, name, owner_id");

    if (error) {
      setToast({ message: "Nie udało się pobrać list.", type: "error" });
    } else {
      const withOwnership = listData.map((list) => ({
        id: list.id,
        name: list.name,
        isOwner: list.owner_id === userId,
      }));
      setLists(withOwnership);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchLists();
  }, []);

  const handleAddList = async () => {
    if (!newListName.trim()) {
      setNameError("Nazwa nie może być pusta.");
      return;
    }
    setNameError(null);

    const { data: userData, error: userError } = await supabase.auth.getUser();
    const userId = userData?.user?.id;

    if (!userId || userError) {
      setToast({ message: "Nie udało się pobrać użytkownika.", type: "error" });
      return;
    }

    const { data: listData, error: listError } = await supabase
      .from("shopping_lists")
      .insert({ name: newListName, owner_id: userId })
      .select()
      .single();

    if (listError || !listData) {
      setToast({ message: "Błąd podczas dodawania listy.", type: "error" });
      return;
    }

    const { error: memberError } = await supabase
      .from("shopping_list_members")
      .insert({ list_id: listData.id, user_id: userId, role: "owner" });

    if (memberError) {
      setToast({ message: "Lista utworzona, ale nie dodano właściciela do członków.", type: "error" });
    }

    setNewListName("");
    await fetchLists();
    setToast({ message: "Lista dodana pomyślnie!", type: "success" });
  };

  const handleRemoveList = async (id: string) => {
    const { error } = await supabase.from("shopping_lists").delete().eq("id", id);
    if (!error) {
      setLists((prev) => prev.filter((list) => list.id !== id));
      setToast({ message: "Usunięto listę", type: "success" });
    } else {
      setToast({ message: "Błąd przy usuwaniu listy", type: "error" });
    }
  };

  const handleEditClick = (list: ShoppingList) => {
    setEditingId(list.id);
    setEditingName(list.name);
  };

  const handleRenameList = async (id: string) => {
    if (!editingName.trim()) return;
    const { error } = await supabase.from("shopping_lists").update({ name: editingName }).eq("id", id);
    if (!error) {
      setToast({ message: "Zmieniono nazwę listy", type: "success" });
      setEditingId(null);
      setEditingName("");
      fetchLists();
    } else {
      setToast({ message: "Błąd podczas zmiany nazwy", type: "error" });
    }
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

      {loading ? (
        <p>Ładowanie</p>
      ) : lists.length === 0 ? (
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
                  list={list}
                  onRemove={list.isOwner ? handleRemoveList : undefined}
                  onEdit={list.isOwner ? () => handleEditClick(list) : undefined}
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
