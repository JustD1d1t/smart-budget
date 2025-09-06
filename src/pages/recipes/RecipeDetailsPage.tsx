import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Button from "../../components/ui/Button";
import { supabase } from "../../lib/supabaseClient";

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
    url?: string | null; // ⬅️ dodane pole
};

export default function RecipeDetailsPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [recipe, setRecipe] = useState<Recipe | null>(null);

    useEffect(() => {
        const fetchRecipe = async () => {
            if (!id) return;

            const { data, error } = await supabase
                .from("recipes")
                .select("*")
                .eq("id", id)
                .single();

            if (error) {
                console.error("Błąd podczas pobierania przepisu:", error.message);
                setRecipe(null);
                return;
            }

            setRecipe(data);
        };

        fetchRecipe();
    }, [id]);

    if (!recipe) {
        return <p className="p-4 text-center text-gray-500">Nie znaleziono przepisu.</p>;
    }

    return (
        <div className="p-4 max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold mb-2">{recipe.name}</h1>

            {recipe.description && (
                <p className="text-gray-600 mb-4">{recipe.description}</p>
            )}

            {recipe.url && (
                <p className="mb-4">
                    📎 Źródło:{" "}
                    <a
                        href={recipe.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 underline"
                    >
                        {recipe.url}
                    </a>
                </p>
            )}

            <h2 className="text-lg font-semibold mb-2">🧂 Składniki</h2>
            <ul className="list-disc pl-6 mb-6">
                {recipe.ingredients.map((i, index) => (
                    <li key={index}>
                        {i.quantity} {i.unit} – {i.name}
                    </li>
                ))}
            </ul>

            <Button onClick={() => navigate(-1)}>⬅️ Wróć</Button>
        </div>
    );
}
