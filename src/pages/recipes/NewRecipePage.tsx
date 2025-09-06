import { useState } from "react";
import { useNavigate } from "react-router-dom";
import IngredientListEditor from "../../components/recipes/IngredientListEditor";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Textarea from "../../components/ui/Textarea";
import { supabase } from "../../lib/supabaseClient";
import { useUserStore } from "../../stores/userStore";

/* 🔧 stała backendUrl – zmieniasz tutaj i działa w całym komponencie */
const backendUrl = "https://react-budget-backend-c8ced9088264.herokuapp.com"; // np. Twój backend-proxy

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

export default function NewRecipePage() {
  const navigate = useNavigate();
  const { user } = useUserStore();

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

  // 🔗 nowy state na link
  const [recipeLink, setRecipeLink] = useState("");

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

  const handleSubmit = async () => {
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

    if (!user?.id) {
      alert("Musisz być zalogowany, aby zapisać przepis.");
      return;
    }

    const { error } = await supabase.from("recipes").insert({
      id: crypto.randomUUID(),
      name: trimmedName,
      description: trimmedDescription,
      ingredients: validIngredients,
      user_id: user.id,
      url: null,
    });

    if (error) {
      console.error("Błąd zapisu przepisu:", error.message);
      alert("Wystąpił błąd podczas zapisu przepisu.");
      return;
    }

    navigate("/recipes");
  };

  /* 🔗 pobieranie przepisu z linka */
  const fetchContent = async (url: string) => {
    try {
      const response = await fetch(`${backendUrl}/html?url=${encodeURIComponent(url)}`);
      const data = await response.json();
      return data.html || data; // backend może zwrócić html w polu html lub wprost
    } catch (error) {
      console.error("Error fetching content:", error);
    }
  };

  const handleAddFromLink = async () => {
    if (!recipeLink.trim()) {
      alert("Podaj adres przepisu.");
      return;
    }

    const recipeResponse = await fetchContent(recipeLink);
    if (!recipeResponse) return;

    const el = document.createElement("html");
    el.innerHTML = recipeResponse.data;

    let parsedName = "";
    let ingredientsNodes: NodeListOf<Element> | null = null;

    if (recipeLink.includes("przepisy.pl")) {
      parsedName = el.querySelector(".title")?.textContent || "";
      ingredientsNodes = el.querySelectorAll(".ingredients-list-content-item");
    } else if (recipeLink.includes("aniagotuje.pl")) {
      parsedName = el.querySelector(".article-content h1")?.textContent || "";
      ingredientsNodes = el.querySelectorAll(".recipe-ing-list li");
    } else if (recipeLink.includes("kwestiasmaku.com")) {
      parsedName = el.querySelector("h1.przepis")?.textContent || "";
      ingredientsNodes = el.querySelectorAll(".field-name-field-skladniki ul li");
    } else if (recipeLink.includes("kuchnialidla.pl")) {
      parsedName = el.querySelector(".lead h1")?.textContent || "";
      ingredientsNodes = el.querySelectorAll(".skladniki ul li");
    } else if (recipeLink.includes("poprostupycha.com.pl")) {
      parsedName = el.querySelector("h1.entry-title")?.textContent || "";
      ingredientsNodes = el.querySelectorAll(".ingredient");
    } else if (recipeLink.includes("aniastarmach.pl")) {
      parsedName = el.querySelector("h1.recipe-name")?.textContent || "";
      ingredientsNodes = el.querySelectorAll(".recipe-what-to-buy ul li");
    } else if (recipeLink.includes("doradcasmaku.pl")) {
      parsedName = el.querySelector("h1.grid-in-title")?.textContent || "";
      ingredientsNodes = el.querySelectorAll(".grid-in-ingredients tbody tr");
    }

    const parsedIngredients: Ingredient[] = [];
    ingredientsNodes?.forEach((node) => {
      parsedIngredients.push({
        name: node.textContent?.trim() || "",
        quantity: 1,
        unit: "",
      });
    });

    if (!parsedName || parsedIngredients.length === 0) {
      alert("Nie udało się odczytać przepisu z tej strony.");
      return;
    }

    if (!user?.id) {
      alert("Musisz być zalogowany, aby zapisać przepis.");
      return;
    }

    const { error } = await supabase.from("recipes").insert({
      id: crypto.randomUUID(),
      name: parsedName,
      description: "Przepis dodany z linka, uzupełnij opis.",
      ingredients: parsedIngredients,
      user_id: user.id,
      url: recipeLink,
    });

    if (error) {
      console.error("Błąd zapisu przepisu:", error.message);
      alert("Wystąpił błąd podczas zapisu przepisu.");
      return;
    }

    setRecipeLink("");
    navigate("/recipes");
  };

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">➕ Nowy przepis</h1>

      <div className="space-y-4">
        {/* 🔗 input na link */}
        <Input
          placeholder="Adres strony z przepisem"
          value={recipeLink}
          onChange={(e) => setRecipeLink(e.target.value)}
        />
        <Button onClick={handleAddFromLink} className="w-full">
          🌐 Dodaj przepis z linka
        </Button>

        <hr className="my-6" />

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
          ✅ Zapisz własny przepis
        </Button>
      </div>
    </div>
  );
}
