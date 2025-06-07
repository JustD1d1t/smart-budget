import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import AddItemForm from "../../components/shopping-list/AddItemForm";
import Accordion from "../../components/ui/Accordion";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Modal from "../../components/ui/Modal";
import Toast from "../../components/ui/Toast";
import { productsDb } from "../../data/productsDb";
import { supabase } from "../../lib/supabaseClient";
import { flattenProductsDb } from "../../utils/flattenProductsDb";

interface ShoppingItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  bought: boolean;
}

interface ShoppingList {
  id: string;
  name: string;
}

interface ShoppingListMember {
  id: string;
  email: string;
  list_id: string;
  role: "owner" | "member";
}

const ShoppingListDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [list, setList] = useState<ShoppingList | null>(null);
  const [editingItem, setEditingItem] = useState<ShoppingItem | null>(null);
  const [members, setMembers] = useState<ShoppingListMember[]>([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type?: "error" | "success" } | null>(null);
  const [isOwner, setIsOwner] = useState(false);

  const flatProducts = flattenProductsDb(productsDb);

  const fetchListDetails = async () => {
    const { data, error } = await supabase
      .from("shopping_lists")
      .select("id, name")
      .eq("id", id)
      .single();

    if (!error) setList(data);
  };

  const fetchItems = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("shopping_items")
      .select("*")
      .eq("list_id", id);

    if (!error && data) {
      const sorted = data.sort((a, b) => a.name.localeCompare(b.name));
      setItems(sorted);
    }
    setLoading(false);
  };

  const fetchMembers = async () => {
    const { data, error } = await supabase
      .from("shopping_list_members")
      .select("id, user_id, list_id, role, email")
      .eq("list_id", id);

    if (!error && data) {
      setMembers(data);

      const user = await supabase.auth.getUser();
      const currentUserId = user.data.user?.id;

      const owner = data.find(m => m.user_id === currentUserId && m.role === "owner");
      setIsOwner(!!owner);
    }
  };


  useEffect(() => {
    if (id) {
      fetchListDetails();
      fetchItems();
      fetchMembers();
    }
  }, [id]);

  const toggleItem = async (itemId: string, current: boolean) => {
    const { error } = await supabase
      .from("shopping_items")
      .update({ bought: !current })
      .eq("id", itemId);

    if (!error) {
      setItems((prev) =>
        prev.map((item) =>
          item.id === itemId ? { ...item, bought: !current } : item
        )
      );
    }
  };

  const handleSaveEdit = async () => {
    if (!editingItem) return;

    const { error } = await supabase
      .from("shopping_items")
      .update({
        name: editingItem.name,
        quantity: editingItem.quantity,
        unit: editingItem.unit,
      })
      .eq("id", editingItem.id);

    if (!error) {
      setItems((prev) =>
        prev
          .map((item) => (item.id === editingItem.id ? editingItem : item))
          .sort((a, b) => a.name.localeCompare(b.name))
      );
      setEditingItem(null);
    }
  };

  const handleDeleteBoughtItems = async () => {
    const boughtIds = items.filter((item) => item.bought).map((item) => item.id);
    if (boughtIds.length === 0) return;

    const { error } = await supabase
      .from("shopping_items")
      .delete()
      .in("id", boughtIds);

    if (!error) {
      setItems((prev) => prev.filter((item) => !item.bought));
    }
  };

  const addItem = (item: ShoppingItem) => {
    setItems((prev) => [...prev, item].sort((a, b) => a.name.localeCompare(b.name)));
  };

  const isValidEmail = (email: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const inviteMember = async () => {
    if (!inviteEmail.trim()) {
      setEmailError("Podaj adres e-mail.");
      return;
    }

    if (!isValidEmail(inviteEmail)) {
      setEmailError("Niepoprawny adres e-mail.");
      return;
    }

    setEmailError(null);

    // Szukamy użytkownika po mailu
    const { data: users, error: userError } = await supabase
      .from("users") // widok z auth.users
      .select("id, email")
      .eq("email", inviteEmail);

    if (userError || !users || users.length === 0) {
      setToast({
        message: "Nie znaleziono użytkownika z tym adresem e-mail.",
        type: "error",
      });
      return;
    }

    const user = users[0];

    // Sprawdź czy już jest na liście
    const { data: existing, error: existingError } = await supabase
      .from("shopping_list_members")
      .select("id")
      .eq("list_id", id)
      .eq("user_id", user.id);

    if (existingError) {
      setToast({ message: "Błąd przy sprawdzaniu członka listy.", type: "error" });
      return;
    }

    if (existing && existing.length > 0) {
      setToast({ message: "Ten użytkownik już należy do listy.", type: "error" });
      return;
    }

    // Dodaj członka z emailem
    const { error: insertError } = await supabase
      .from("shopping_list_members")
      .insert({
        list_id: id,
        user_id: user.id,
        email: user.email, // kopiujemy email do członków listy
        role: "member",
      });

    if (insertError) {
      setToast({ message: "Błąd przy zapraszaniu użytkownika.", type: "error" });
    } else {
      setInviteEmail("");
      setToast({ message: "Użytkownik zaproszony!", type: "success" });
      fetchMembers();
    }
  };


  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-xl font-bold mb-4">
        Szczegóły listy zakupowej{list ? `: ${list.name}` : ""}
      </h1>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
      <Accordion title="Współtwórcy">
        {isOwner && (
          <div className="mb-4">
            <Input
              placeholder="Email osoby do zaproszenia"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              error={emailError || undefined}
            />
            <Button onClick={inviteMember} className="mt-2">Zaproś</Button>
          </div>
        )}
        {members.length > 0 && (
          <div className="mt-6 mb-4">
            <h2 className="text-lg font-semibold mb-2">Współtwórcy listy:</h2>
            <ul className="space-y-1">
              {members.map((member) => (
                <li
                  key={member.id}
                  className="flex justify-between items-center border p-2 rounded"
                >
                  <span>{member.email}</span>
                  {isOwner && member.role !== "owner" && (
                    <Button variant="danger" onClick={() => removeMember(member.id)}>
                      Usuń
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </Accordion>

      <AddItemForm
        listId={id!}
        productsDb={flatProducts}
        onItemAdded={addItem}
      />

      {loading ? (
        <p>Ładowanie</p>
      ) : items.length === 0 ? (
        <p>Brak produktów na tej liście.</p>
      ) : (
        <>
          <ul className="space-y-2 mt-4">
            {items.map((item) => (
              <li
                key={item.id}
                className="flex items-center gap-2 justify-between"
              >
                <div
                  className="flex items-center gap-2 cursor-pointer"
                  onClick={() => toggleItem(item.id, item.bought)}
                >
                  <input type="checkbox" checked={item.bought} readOnly />
                  <span className={item.bought ? "line-through text-gray-500" : ""}>
                    {item.name} ({item.quantity} {item.unit})
                  </span>
                </div>
                <button
                  className="text-sm text-blue-500 hover:underline"
                  onClick={() => setEditingItem(item)}
                >
                  Edytuj
                </button>
              </li>
            ))}
          </ul>
          <div className="mt-4 text-right">
            <Button onClick={handleDeleteBoughtItems} variant="danger">Usuń kupione</Button>
          </div>
        </>
      )}

      {editingItem && (
        <Modal onClose={() => setEditingItem(null)}>
          <div className="space-y-2">
            <h2 className="text-lg font-semibold">Edytuj: {editingItem.name}</h2>
            <Input
              placeholder="Nazwa"
              value={editingItem.name}
              onChange={(e) =>
                setEditingItem({ ...editingItem, name: e.target.value })
              }
            />
            <Input
              placeholder="Ilość"
              type="number"
              value={String(editingItem.quantity)}
              onChange={(e) =>
                setEditingItem({
                  ...editingItem,
                  quantity: Number(e.target.value),
                })
              }
            />
            <select
              value={editingItem.unit}
              onChange={(e) =>
                setEditingItem({ ...editingItem, unit: e.target.value })
              }
              className="w-full p-2 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-black"
            >
              <option value="szt">szt</option>
              <option value="kg">kg</option>
              <option value="g">g</option>
              <option value="l">l</option>
              <option value="ml">ml</option>
            </select>
            <div className="flex justify-end gap-2">
              <Button onClick={() => setEditingItem(null)} variant="outline">Anuluj</Button>
              <Button onClick={handleSaveEdit}>Zapisz</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default ShoppingListDetailsPage;
