import { useState } from "react";
import { useNavigate } from "react-router-dom";
import IngredientListEditor from "../../components/recipes/IngredientListEditor";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Textarea from "../../components/ui/Textarea";

type Ingredient = {
  name: string;
  quantity: number;
  unit: string;
};

type IngredientError = {
  name?: string;
  quantity?: string;
  unit?: string;
};

type Recipe = {
  id: string;
  name: string;
  description: string;
  ingredients: Ingredient[];
};

export default function NewRecipePage() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [ingredients, setIngredients] = useState<Ingredient[]>([
    { name: "", quantity: 1, unit: "" },
  ]);
  const [errors, setErrors] = useState<{
    name?: string;
    description?: string;
    ingredients?: string;
    ingredientFields: IngredientError[];
  }>({
    ingredientFields: [],
  });

  const handleAddIngredient = () => {
    setIngredients([...ingredients, { name: "", quantity: 1, unit: "" }]);
    setErrors((prev) => ({
      ...prev,
      ingredientFields: [...prev.ingredientFields, {}],
    }));
  };

  const handleRemoveIngredient = (index: number) => {
    setIngredients((prev) => prev.filter((_, i) => i !== index));
    setErrors((prev) => ({
      ...prev,
      ingredientFields: prev.ingredientFields.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = () => {
    const trimmedName = name.trim();
    const trimmedDescription = description.trim();
    const ingredientErrors: IngredientError[] = [];

    const validIngredients = ingredients.filter((i) => i.name.trim() !== "");

    const newErrors: {
      name?: string;
      description?: string;
      ingredients?: string;
      ingredientFields: IngredientError[];
    } = { ingredientFields: [] };

    if (!trimmedName) {
      newErrors.name = "Nazwa przepisu jest wymagana.";
    }

    if (trimmedDescription.length < 50) {
      newErrors.description = "Opis musi zawierać co najmniej 50 znaków.";
    }

    if (validIngredients.length < 2) {
      newErrors.ingredients = "Podaj co najmniej 2 składniki z nazwą.";
    }

    ingredients.forEach((i, index) => {
      const err: IngredientError = {};

      if (i.name.trim() !== "") {
        if (isNaN(i.quantity) || i.quantity <= 0) {
          err.quantity = "Podaj poprawną ilość (> 0)";
        }

        if (!i.unit.trim()) {
          err.unit = "Wybierz jednostkę";
        }
      }

      ingredientErrors[index] = err;
    });

    newErrors.ingredientFields = ingredientErrors;

    const hasAnyErrors =
      !!newErrors.name ||
      !!newErrors.description ||
      !!newErrors.ingredients ||
      ingredientErrors.some((e) => Object.keys(e).length > 0);

    setErrors(newErrors);
    if (hasAnyErrors) return;

    const newRecipe: Recipe = {
      id: crypto.randomUUID(),
      name: trimmedName,
      description: trimmedDescription,
      ingredients: validIngredients,
    };

    const saved = localStorage.getItem("recipes");
    const current = saved ? JSON.parse(saved) : [];
    localStorage.setItem("recipes", JSON.stringify([...current, newRecipe]));
    navigate("/recipes");
  };

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">➕ Nowy przepis</h1>

      <div className="space-y-4">
        <Input
          placeholder="Nazwa przepisu"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={errors.name}
        />

        <Textarea
          placeholder="Opis (min. 50 znaków)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          error={errors.description}
        />

        <h2 className="font-semibold text-lg mt-4">Składniki</h2>

        <IngredientListEditor
          ingredients={ingredients}
          setIngredients={setIngredients}
          errors={errors.ingredientFields}
        />

        {errors.ingredients && (
          <p className="text-sm text-red-500">{errors.ingredients}</p>
        )}

        <Button onClick={handleAddIngredient} className="mt-2 mr-4">
          ➕ Dodaj składnik
        </Button>

        <Button onClick={handleSubmit} className="mt-4">
          ✅ Zapisz przepis
        </Button>
      </div>
    </div>
  );
}
