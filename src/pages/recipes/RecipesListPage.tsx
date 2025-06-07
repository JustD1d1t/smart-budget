import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";

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
    const navigate = useNavigate();

    useEffect(() => {
        const saved = localStorage.getItem("recipes");
        if (saved) {
            setRecipes(JSON.parse(saved));
        }
    }, []);

    const addToShoppingList = (recipe: Recipe) => {
        const saved = localStorage.getItem("shoppingList");
        const currentList = saved ? JSON.parse(saved) : [];

        const newItems = recipe.ingredients.map((i) => ({
            name: i.name,
            quantity: i.quantity,
            unit: i.unit,
        }));

        localStorage.setItem("shoppingList", JSON.stringify([...currentList, ...newItems]));
        alert(`Dodano składniki przepisu "${recipe.name}" do listy zakupów.`);
    };

    const deleteRecipe = (id: string) => {
        const updated = recipes.filter((r) => r.id !== id);
        setRecipes(updated);
        localStorage.setItem("recipes", JSON.stringify(updated));
    };

    return (
        <div className="p-4 max-w-3xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">📖 Przepisy</h1>
                <Button onClick={() => navigate("/recipes/new")}>
                    ➕ Dodaj przepis
                </Button>
            </div>

            <div className="space-y-4">
                {recipes.length === 0 && (
                    <p className="text-gray-500 text-center">Brak przepisów. Dodaj swój pierwszy przepis!</p>
                )}

                {recipes.map((recipe) => (
                    <Card key={recipe.id} className="p-4">
                        <div className="flex flex-col justify-between items-start">
                            <h2 className="text-xl font-semibold">{recipe.name}</h2>
                            {recipe.description && (
                                <p className="text-gray-600 mt-1 line-clamp-2">{recipe.description}</p>
                            )}
                        </div>

                        <Button onClick={() => addToShoppingList(recipe)} className="mt-3">
                            ➕ Dodaj do listy zakupów
                        </Button>
                        <Button
                            onClick={() => deleteRecipe(recipe.id)}
                            className="ml-4 mr-4"
                            variant="danger"
                        >
                            🗑️ Usuń
                        </Button>
                        <Button onClick={() => navigate(`/recipes/${recipe.id}`)}>
                            📖 Otwórz przepis
                        </Button>
                    </Card>
                ))}
            </div>
        </div>
    );
}
