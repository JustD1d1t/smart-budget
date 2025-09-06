import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import ConfirmModal from "../../components/ui/ConfirmModal";
import ShoppingListSelectModal from "../../components/ui/ShoppingListSelectModal";
import Toast from "../../components/ui/Toast";
import { supabase } from "../../lib/supabaseClient";
import { useUserStore } from "../../stores/userStore";

type Ingredient = {
  name: string;
  quantity: number;
  unit: string;
};

type Recipe = {
  id: string;
  name: string;
  description?: string;
  ingredients: Ingredient[];
};

export default function RecipesListPage() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [toast, setToast] = useState<{ message: string; type?: "error" | "success" } | null>(null);

  // confirm modal
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [recipeToDelete, setRecipeToDelete] = useState<Recipe | null>(null);

  const navigate = useNavigate();
  const { user } = useUserStore();

  useEffect(() => {
    const fetchRecipes = async () => {
      if (!user?.id) return;

      const { data, error } = await supabase
        .from("recipes")
        .select("*")
        .eq("user_id", user.id)
        .order("name");

      if (error) {
        console.error("Błąd podczas pobierania przepisów:", error.message);
        setToast({ message: "Nie udało się pobrać przepisów", type: "error" });
        return;
      }

      setRecipes(data || []);
    };

    fetchRecipes();
  }, [user?.id]);

  const handleAddToShoppingList = (recipe: Recipe) => {
    setSelectedRecipe(recipe);
    setTimeout(() => setModalOpen(true), 0);
  };

  const handleListSelected = async (listId: string) => {
    if (!selectedRecipe) return;

    const itemsToInsert = selectedRecipe.ingredients.map((ing) => ({
      list_id: listId,
      name: ing.name,
      quantity: ing.quantity,
      unit: ing.unit,
      bought: false,
      category: "żywność",
      recipe: selectedRecipe.name,
    }));

    const { error } = await supabase.from("shopping_items").insert(itemsToInsert);

    if (error) {
      setToast({ message: "Nie udało się dodać składników do listy.", type: "error" });
    } else {
      setToast({
        message: `Dodano składniki przepisu "${selectedRecipe.name}" do listy.`,
        type: "success",
      });
    }

    setModalOpen(false);
    setSelectedRecipe(null);
  };

  // obsługa usuwania z confirm modal
  const askDeleteRecipe = (recipe: Recipe) => {
    setRecipeToDelete(recipe);
    setConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!recipeToDelete) return;

    const { error } = await supabase.from("recipes").delete().eq("id", recipeToDelete.id);

    if (error) {
      console.error("Błąd podczas usuwania przepisu:", error.message);
      setToast({ message: "Nie udało się usunąć przepisu", type: "error" });
    } else {
      setRecipes((prev) => prev.filter((r) => r.id !== recipeToDelete.id));
      setToast({ message: "Przepis usunięty", type: "success" });
    }

    setRecipeToDelete(null);
    setConfirmOpen(false);
  };

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">📖 Przepisy</h1>
        <Button onClick={() => navigate("/recipes/new")}>➕ Dodaj przepis</Button>
      </div>

      <div className="space-y-4">
        {recipes.length === 0 && (
          <p className="text-gray-500 text-center">
            Brak przepisów. Dodaj swój pierwszy przepis!
          </p>
        )}

        {recipes.map((recipe) => (
          <Card key={recipe.id} className="p-4">
            <div className="flex flex-col justify-between items-start">
              <h2 className="text-xl font-semibold">{recipe.name}</h2>
              {recipe.description && (
                <p className="text-gray-600 mt-1 line-clamp-2">{recipe.description}</p>
              )}
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              <Button onClick={() => handleAddToShoppingList(recipe)}>
                ➕ Dodaj do listy zakupów
              </Button>
              <Button onClick={() => askDeleteRecipe(recipe)} variant="danger">
                🗑️ Usuń
              </Button>
              <Button onClick={() => navigate(`/recipes/${recipe.id}`)}>
                📖 Otwórz przepis
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {modalOpen && (
        <ShoppingListSelectModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          onSelect={handleListSelected}
        />
      )}

      <ConfirmModal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Potwierdź usunięcie"
        description={
          recipeToDelete
            ? `Czy na pewno chcesz usunąć przepis "${recipeToDelete.name}"?`
            : undefined
        }
        onConfirm={confirmDelete}
        variant="critical"
        confirmText="Usuń"
        cancelText="Anuluj"
      />

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </>
  );
}
