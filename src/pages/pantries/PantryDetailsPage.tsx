import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import AddPantryItemModal from "../../components/pantries/AddPantryItemModal";
import GroupedItemList from "../../components/pantries/GroupedItemList";
import ItemList from "../../components/pantries/ItemList";
import PantryItemModal from "../../components/pantries/PantryItemModal";
import Button from "../../components/ui/Button";
import MemberList from "../../components/ui/MemberList";
import Toast from "../../components/ui/Toast";
import { usePantriesStore } from "../../stores/pantriesStore";

function normalize(str: string) {
  return (str || "")
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

export default function PantryDetailsPage() {
  const { id } = useParams<{ id: string }>();

  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [filterCategory, setFilterCategory] = useState("all");
  const [sortBy, setSortBy] = useState<"name" | "category" | "expiry_date">("name");
  const [groupedView, setGroupedView] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [search, setSearch] = useState("");

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
  }, [id, fetchPantryDetails, fetchPantryItems, fetchPantryMembers]);

  const handleSaveEdit = async () => {
    if (!editingItem) return;
    await updatePantryItem(editingItem);
    setEditingItem(null);
  };

  const handleDeleteItem = async (itemId: string) => {
    await deletePantryItem(itemId);
  };

  const handleQuantityChange = async (itemId: string, newQuantity: number) => {
    await updateItemQuantity(itemId, newQuantity);
  };

  const handleInvite = async (email: string) => {
    const result = await inviteMember(id!, email);
    setToast({ message: result.message, type: result.success ? "success" : "error" });
  };

  const handleRemove = async (memberId: string) => {
    await removeMember(memberId);
    setToast({ message: "Użytkownik usunięty.", type: "success" });
  };

  const categories = useMemo(
    () => Array.from(new Set(pantryItems.map((item: any) => item.category))),
    [pantryItems]
  );

  const filteredItems = useMemo(() => {
    const q = normalize(search);

    return pantryItems
      .filter((item: any) => {
        // contains po nazwie (case/diacritics-insensitive)
        const matchesSearch = q.length === 0 || normalize(item.name).includes(q);
        const matchesCategory = filterCategory === "all" || item.category === filterCategory;
        return matchesSearch && matchesCategory;
      })
      .sort((a: any, b: any) => {
        if (sortBy === "name") return a.name.localeCompare(b.name);
        if (sortBy === "category")
          return a.category.localeCompare(b.category) || a.name.localeCompare(b.name);
        if (sortBy === "expiry_date") {
          const dateA = a.expiry_date ? new Date(a.expiry_date).getTime() : Infinity;
          const dateB = b.expiry_date ? new Date(b.expiry_date).getTime() : Infinity;
          return dateA - dateB;
        }
        return 0;
      });
  }, [pantryItems, search, filterCategory, sortBy]);

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-xl font-bold mb-4">
        Szczegóły spiżarni{selectedPantry ? `: ${selectedPantry.name}` : ""}
      </h1>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* 🔹 Współtwórcy na górze */}
      {isOwner && (
        <div className="mb-6">
          <MemberList
            isOwner={true}
            members={pantryMembers}
            onInvite={handleInvite}
            onRemove={handleRemove}
          />
        </div>
      )}

      {/* 🔹 Przyciski obok siebie */}
      <div className="flex gap-2 mb-4">
        <Button onClick={() => setShowAddModal(true)} className="flex-1 sm:flex-none">
          Dodaj produkt
        </Button>
        <Button onClick={() => setGroupedView(!groupedView)} className="flex-1 sm:flex-none text-sm">
          {groupedView ? "Pokaż jako listę" : "Pogrupuj po kategoriach"}
        </Button>
      </div>

      {/* 🔹 Wyszukiwarka + filtry */}
      <div className="flex flex-col gap-2 mb-6 sm:flex-row">
        <input
          type="text"
          className="border p-2 rounded text-sm flex-1"
          placeholder="Szukaj produktu…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="border p-2 rounded text-sm flex-1"
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
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="border p-2 rounded text-sm flex-1"
          >
            <option value="name">Sortuj alfabetycznie</option>
            <option value="category">Sortuj po kategorii</option>
            <option value="expiry_date">Sortuj po dacie przydatności</option>
          </select>
        )}
      </div>

      {/* 🔹 Modal dodawania produktu */}
      {showAddModal && (
        <AddPantryItemModal
          pantryId={id!}
          onClose={() => setShowAddModal(false)}
          onItemAdded={(item) => {
            addPantryItem(item);
            setToast({ message: "Dodano produkt.", type: "success" });
          }}
        />
      )}

      {/* 🔹 Lista lub widok grupowany */}
      {loading ? (
        <p>Ładowanie...</p>
      ) : filteredItems.length === 0 ? (
        <p>Brak produktów</p>
      ) : groupedView ? (
        <GroupedItemList items={filteredItems} onEdit={setEditingItem} onDelete={handleDeleteItem} />
      ) : (
        <ItemList
          items={filteredItems}
          onEdit={setEditingItem}
          onDelete={handleDeleteItem}
          onQuantityChange={handleQuantityChange}
        />
      )}

      {/* 🔹 Jeden modal: akcje + edycja w jednym widoku */}
      {editingItem && (
        <PantryItemModal
          item={editingItem}
          onChange={setEditingItem}
          onSave={handleSaveEdit}
          onClose={() => setEditingItem(null)}
          onQuantityChange={handleQuantityChange}
          onDelete={handleDeleteItem}
        />
      )}
    </div>
  );
}
