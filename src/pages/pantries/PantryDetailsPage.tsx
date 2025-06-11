import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import AddPantryItemForm from "../../components/pantries/AddPantryItemForm";
import EditPantryItemModal from "../../components/pantries/EditPantryItemModal";
import GroupedItemList from "../../components/pantries/GroupedItemList";
import ItemList from "../../components/pantries/ItemList";
import Button from "../../components/ui/Button";
import MemberList from "../../components/ui/MemberList";
import Toast from "../../components/ui/Toast";
import { usePantriesStore } from "../../stores/pantriesStore";

export default function PantryDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const [editingItem, setEditingItem] = useState(null);
  const [toast, setToast] = useState(null);
  const [filterCategory, setFilterCategory] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [groupedView, setGroupedView] = useState(false);

  const {
    selectedPantry,
    isOwner,
    pantryItems,
    pantryMembers,
    loading,
    fetchPantryDetails,
    fetchPantryItems,
    fetchPantryMembers,
    updatePantryItem,
    deletePantryItem,
    updateItemQuantity,
    inviteMember,
    removeMember,
    addPantryItem,
  } = usePantriesStore();

  useEffect(() => {
    if (id) {
      fetchPantryDetails(id);
      fetchPantryItems(id);
      fetchPantryMembers(id);
    }
  }, [id]);

  const handleSaveEdit = async () => {
    if (!editingItem) return;
    updatePantryItem(editingItem);
    setEditingItem(null);
  };

  const handleDeleteItem = async (itemId) => {
    await deletePantryItem(itemId);
  };

  const handleQuantityChange = async (itemId, newQuantity) => {
    await updateItemQuantity(itemId, newQuantity);
  };

  const handleInvite = async (email) => {
    const result = await inviteMember(id, email);
    setToast({ message: result.message, type: result.success ? "success" : "error" });
  };

  const handleRemove = async (memberId) => {
    await removeMember(memberId);
    setToast({ message: "Użytkownik usunięty.", type: "success" });
  };

  const filteredItems = pantryItems
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

  const categories = [...new Set(pantryItems.map((item) => item.category))];

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-xl font-bold mb-4">
        Szczegóły spiżarni{selectedPantry ? `: ${selectedPantry.name}` : ""}
      </h1>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {isOwner && (
        <MemberList
          isOwner={true}
          members={pantryMembers}
          onInvite={handleInvite}
          onRemove={handleRemove}
        />
      )}

      <AddPantryItemForm pantryId={id} onItemAdded={addPantryItem} />

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
            onChange={(e) => setSortBy(e.target.value)}
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
