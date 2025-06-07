import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import AddItemForm from "../../components/shopping-list/AddItemForm";
import EditItemModal from "../../components/shopping-list/EditItemModal";
import GroupedItemList from "../../components/shopping-list/GroupedItemList";
import ItemList from "../../components/shopping-list/ItemList";
import MemberList from "../../components/shopping-list/MemberList";
import Button from "../../components/ui/Button";
import Toast from "../../components/ui/Toast";
import { supabase } from "../../lib/supabaseClient";

interface ShoppingItem {
  id: string;
  name: string;
  category: string;
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
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"name" | "category">("name");
  const [groupedView, setGroupedView] = useState(false);

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
      setItems(data);
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
        prev.map((item) => (item.id === editingItem.id ? editingItem : item))
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
    setItems((prev) => [...prev, item]);
  };

  const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

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

    const { data: users } = await supabase
      .from("users")
      .select("id, email")
      .eq("email", inviteEmail);

    if (!users || users.length === 0) {
      setToast({ message: "Nie znaleziono użytkownika.", type: "error" });
      return;
    }

    const user = users[0];

    const { data: existing } = await supabase
      .from("shopping_list_members")
      .select("id")
      .eq("list_id", id)
      .eq("user_id", user.id);

    if (existing && existing.length > 0) {
      setToast({ message: "Ten użytkownik już należy do listy.", type: "error" });
      return;
    }

    const { error } = await supabase
      .from("shopping_list_members")
      .insert({
        list_id: id,
        user_id: user.id,
        email: user.email,
        role: "member",
      });

    if (error) {
      setToast({ message: "Błąd przy zapraszaniu.", type: "error" });
    } else {
      setInviteEmail("");
      setToast({ message: "Użytkownik zaproszony!", type: "success" });
      fetchMembers();
    }
  };

  const filteredItems = items
    .filter((item) => filterCategory === "all" || item.category === filterCategory)
    .sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name);
      return a.category.localeCompare(b.category) || a.name.localeCompare(b.name);
    });

  const categories = [...new Set(items.map((item) => item.category))];

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-xl font-bold mb-4">
        Szczegóły listy zakupowej{list ? `: ${list.name}` : ""}
      </h1>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <MemberList
        isOwner={isOwner}
        members={members}
        inviteEmail={inviteEmail}
        emailError={emailError}
        onEmailChange={setInviteEmail}
        onInvite={inviteMember}
      />

      <AddItemForm listId={id!} onItemAdded={addItem} />

      <div className="flex items-center gap-2 mt-6 mb-2">
        <Button onClick={() => setGroupedView(!groupedView)} className="text-sm w-xl">
          {groupedView ? "Pokaż jako listę" : "Pogrupuj po kategoriach"}
        </Button>
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="border p-2 rounded text-sm"
        >
          <option value="all">Wszystkie kategorie</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
        {!groupedView && (
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as "name" | "category")}
            className="border p-2 rounded text-sm"
          >
            <option value="name">Sortuj alfabetycznie</option>
            <option value="category">Sortuj po kategorii</option>
          </select>
        )}
      </div>

      {loading ? (
        <p>Ładowanie</p>
      ) : filteredItems.length === 0 ? (
        <p>Brak produktów</p>
      ) : groupedView ? (
        <GroupedItemList
          items={filteredItems}
          filterCategory={filterCategory}
          onToggle={toggleItem}
          onEdit={setEditingItem}
        />
      ) : (
        <ItemList
          items={filteredItems}
          onToggle={toggleItem}
          onEdit={setEditingItem}
        />
      )}

      <div className="mt-4 text-right">
        <Button onClick={handleDeleteBoughtItems} variant="danger">Usuń kupione</Button>
      </div>

      {editingItem && (
        <EditItemModal
          item={editingItem}
          onChange={setEditingItem}
          onClose={() => setEditingItem(null)}
          onSave={handleSaveEdit}
        />
      )}
    </div>
  );
};

export default ShoppingListDetailsPage;
