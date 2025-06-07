import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Toast from "../../components/ui/Toast";
import { supabase } from "../../lib/supabaseClient";

interface ShoppingList {
  id: string;
  name: string;
  isOwner: boolean;
  isEditing?: boolean;
}

const ShoppingListsPage = () => {
  const [lists, setLists] = useState<ShoppingList[]>([]);
  const [loading, setLoading] = useState(true);
  const [newListName, setNewListName] = useState("");
  const [nameError, setNameError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type?: "error" | "success" } | null>(null);
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
        ...list,
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

  const handleRenameList = async (id: string, newName: string) => {
    if (!newName.trim()) return;
    const { error } = await supabase.from("shopping_lists").update({ name: newName }).eq("id", id);
    if (!error) {
      setToast({ message: "Zmieniono nazwę listy", type: "success" });
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
      {loading ? <p>Ładowanie</p> : lists.length === 0 ? (
        <p>Brak list zakupowych.</p>
      ) : (
        <ul className="space-y-4">
          {lists.map((list, index) => (
            <li key={list.id} className="border rounded p-4">
              <div className="flex justify-between items-center mb-2">
                {list.isEditing ? (
                  <>
                    <Input
                      value={list.name}
                      onChange={(e) => {
                        const updated = [...lists];
                        updated[index].name = e.target.value;
                        setLists(updated);
                      }}
                    />
                    <Button
                      onClick={() => {
                        handleRenameList(list.id, list.name);
                        const updated = [...lists];
                        updated[index].isEditing = false;
                        setLists(updated);
                      }}
                    >
                      Zapisz
                    </Button>
                  </>
                ) : (
                  <>
                    <h2 className="text-lg font-semibold">{list.name}</h2>
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={() => navigate(`/shopping-lists/${list.id}`)}>
                        Otwórz
                      </Button>
                      {list.isOwner && (
                        <>
                          <Button
                            onClick={() => {
                              const updated = [...lists];
                              updated[index].isEditing = true;
                              setLists(updated);
                            }}
                          >
                            Zmień nazwę
                          </Button>
                          <Button variant="danger" onClick={() => handleRemoveList(list.id)}>
                            Usuń
                          </Button>
                        </>
                      )}
                    </div>
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ShoppingListsPage;
