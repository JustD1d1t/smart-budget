import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import AddPantryItemForm from "../../components/pantries/AddPantryItemForm";
import EditPantryItemModal from "../../components/pantries/EditPantryItemModal";
import GroupedItemList from "../../components/pantries/GroupedItemList";
import ItemList from "../../components/pantries/ItemList";
import Button from "../../components/ui/Button";
import Toast from "../../components/ui/Toast";
import { supabase } from "../../lib/supabaseClient";

interface PantryItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  expiry_date?: string | null;
}

interface Pantry {
  id: string;
  name: string;
}

export default function PantryDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const [items, setItems] = useState<PantryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [pantry, setPantry] = useState<Pantry | null>(null);
  const [editingItem, setEditingItem] = useState<PantryItem | null>(null);
  const [toast, setToast] = useState<{ message: string; type?: "error" | "success" } | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"name" | "category" | "expiry_date">("name");
  const [groupedView, setGroupedView] = useState(false);

  const fetchPantry = async () => {
    const { data, error } = await supabase
      .from("pantries")
      .select("id, name")
      .eq("id", id)
      .single();

    if (!error && data) {
      setPantry(data);
    }
  };

  const fetchItems = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("pantry_items")
      .select("*")
      .eq("pantry_id", id);

    if (!error && data) {
      setItems(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (id) {
      fetchPantry();
      fetchItems();
    }
  }, [id]);

  const handleSaveEdit = async () => {
    if (!editingItem) return;

    const { error } = await supabase
      .from("pantry_items")
      .update({
        name: editingItem.name,
        quantity: editingItem.quantity,
        unit: editingItem.unit,
        category: editingItem.category,
        expiry_date: editingItem.expiry_date || null,
      })
      .eq("id", editingItem.id);

    if (!error) {
      setItems((prev) =>
        prev.map((item) => (item.id === editingItem.id ? editingItem : item))
      );
      setEditingItem(null);
    }
  };

  const handleDeleteItem = async (id: string) => {
    const { error } = await supabase.from("pantry_items").delete().eq("id", id);
    if (!error) {
      setItems((prev) => prev.filter((item) => item.id !== id));
    }
  };

  const addItem = (item: PantryItem) => {
    setItems((prev) => [...prev, item]);
  };

  const filteredItems = items
    .filter((item) => filterCategory === "all" || item.category === filterCategory)
    .sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name);
      if (sortBy === "category") return a.category.localeCompare(b.category) || a.name.localeCompare(b.name);
      if (sortBy === "expiry_date") {
        const dateA = a.expiry_date ? new Date(a.expiry_date).getTime() : Infinity;
        const dateB = b.expiry_date ? new Date(b.expiry_date).getTime() : Infinity;
        return dateA - dateB;
      }
      return 0;
    });

  const categories = [...new Set(items.map((item) => item.category))];

  const handleQuantityChange = async (id: string, newQuantity: number) => {
    const item = items.find((item) => item.id === id);
    if (!item || newQuantity < 0) return;

    const { error } = await supabase
      .from("pantry_items")
      .update({ quantity: newQuantity })
      .eq("id", id);

    if (!error) {
      setItems((prev) =>
        prev.map((i) =>
          i.id === id ? { ...i, quantity: newQuantity } : i
        )
      );
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-xl font-bold mb-4">
        Szczegóły spiżarni{pantry ? `: ${pantry.name}` : ""}
      </h1>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <AddPantryItemForm pantryId={id!} onItemAdded={addItem} />

      <div className="flex items-center gap-2 mt-6 mb-2">
        <Button onClick={() => setGroupedView(!groupedView)} className="text-sm">
          {groupedView ? "Pokaż jako listę" : "Pogrupuj po kategoriach"}
        </Button>

        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="border p-2 rounded text-sm"
        >
          <option value="all">Wszystkie kategorie</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>

        {!groupedView && (
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as "name" | "category" | "expiry_date")}
            className="border p-2 rounded text-sm"
          >
            <option value="name">Sortuj alfabetycznie</option>
            <option value="category">Sortuj po kategorii</option>
            <option value="expiry_date">Sortuj po dacie przydatności</option>
          </select>
        )}
      </div>

      {loading ? (
        <p>Ładowanie...</p>
      ) : filteredItems.length === 0 ? (
        <p>Brak produktów</p>
      ) : groupedView ? (
        <GroupedItemList
          items={filteredItems}
          onEdit={setEditingItem}
          onDelete={handleDeleteItem}
        />
      ) : (
        <ItemList
          items={filteredItems}
          onEdit={setEditingItem}
          onDelete={handleDeleteItem}
          onQuantityChange={handleQuantityChange}
        />
      )}

      {editingItem && (
        <EditPantryItemModal
          item={editingItem}
          onChange={setEditingItem}
          onClose={() => setEditingItem(null)}
          onSave={handleSaveEdit}
        />
      )}
    </div>
  );
}
