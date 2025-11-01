import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import AddPantryItemModal from "../../components/pantries/AddPantryItemModal";
import GroupedItemList from "../../components/pantries/GroupedItemList";
import ItemList from "../../components/pantries/ItemList";
import PantryItemModal from "../../components/pantries/PantryItemModal";
import Button from "../../components/ui/Button";
import MemberList from "../../components/ui/MemberList";
import Modal from "../../components/ui/Modal";
import Toast from "../../components/ui/Toast";
import { supabase } from "../../lib/supabaseClient";
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

  // stan dla „spadło do 0”
  const [depletedItem, setDepletedItem] = useState<any | null>(null);
  const [shoppingLists, setShoppingLists] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedListId, setSelectedListId] = useState<string>("");

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

  // pobierz listy zakupowe (na RLS i auth polecą tylko dostępne)
  const loadShoppingLists = async () => {
    const { data, error } = await supabase
      .from("shopping_lists")
      .select("id,name")
      .order("name", { ascending: true });

    if (error) {
      console.error("Błąd pobierania list zakupowych:", error.message);
      setShoppingLists([]);
      return;
    }
    setShoppingLists((data || []) as Array<{ id: string; name: string }>);
  };

  // gdy ilość spada do 0 → pokaż modal z listami (nie aktualizuj już ilości na 0 w DB),
  // po decyzji: (opcjonalnie) dodaj do listy, a na końcu usuń produkt ze spiżarni
  const handleQuantityChange = async (itemId: string, newQuantity: number) => {
    if (newQuantity === 0) {
      const item = pantryItems.find((it: any) => it.id === itemId);
      if (!item) return;

      setDepletedItem(item);
      setSelectedListId("");
      await loadShoppingLists();
      return; // nie wywołujemy updateItemQuantity(0)
    }

    // standardowo aktualizuj ilość
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

  // potwierdzenie z modalem: opcjonalne dodanie do listy → usunięcie ze spiżarni
  const confirmDepletedAction = async () => {
    if (!depletedItem) return;

    try {
      if (selectedListId) {
        console.log('try');
        // dodajemy pozycję do listy zakupowej (prosty insert; dopasuj do swojej tabeli)
        await supabase.from("shopping_items").insert({
          list_id: selectedListId,
          name: depletedItem.name,
          quantity: 1, // domyślnie 1 szt – dopasuj wg potrzeb
          unit: depletedItem.unit,
          category: depletedItem.category,
          // możesz dodać pantry_item_id jeśli masz taką kolumnę, albo notes
        });
      }

      // zawsze usuwamy ze spiżarni (wymóg)
      await deletePantryItem(depletedItem.id);
      setToast({
        message: selectedListId ? "Przeniesiono do listy zakupowej i usunięto ze spiżarni." : "Usunięto ze spiżarni.",
        type: "success",
      });
    } catch (e: any) {
      console.error(e);
      setToast({ message: "Wystąpił błąd przy przenoszeniu/usuwaniu.", type: "error" });
    } finally {
      setDepletedItem(null);
      setSelectedListId("");
    }
  };

  const cancelDepletedAction = async () => {
    // użytkownik wybrał „nie dodawaj” → tylko usuń ze spiżarni
    if (!depletedItem) return;
    try {
      await deletePantryItem(depletedItem.id);
      setToast({ message: "Usunięto ze spiżarni.", type: "success" });
    } catch (e: any) {
      console.error(e);
      setToast({ message: "Błąd podczas usuwania.", type: "error" });
    } finally {
      setDepletedItem(null);
      setSelectedListId("");
    }
  };

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

      {/* 🔹 Modal „dodać do listy zakupowej?” dla produktu, który spadł do 0 */}
      {depletedItem && (
        <Modal onClose={() => setDepletedItem(null)}>
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">
              {depletedItem.name} się skończył. Dodać do listy zakupowej?
            </h3>

            {shoppingLists.length === 0 ? (
              <p className="text-sm text-gray-600">Brak dostępnych list zakupowych.</p>
            ) : (
              <div>
                <label className="block text-sm mb-1">Wybierz listę (opcjonalnie):</label>
                <select
                  value={selectedListId}
                  onChange={(e) => setSelectedListId(e.target.value)}
                  className="border rounded p-2 w-full text-sm"
                >
                  <option value="">Nie dodawaj do żadnej listy</option>
                  {shoppingLists.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex gap-2 justify-end">
              <Button
                className="bg-gray-200 text-gray-800 hover:bg-gray-300"
                onClick={cancelDepletedAction}
              >
                Nie dodawaj (usuń ze spiżarni)
              </Button>
              <Button onClick={confirmDepletedAction}>
                {selectedListId ? "Dodaj do listy i usuń" : "Usuń ze spiżarni"}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
