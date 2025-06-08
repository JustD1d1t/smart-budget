import { productsDb } from "../../data/productsDb";
import { flattenProductsDb } from "../../utils/flattenProductsDb";
import IngredientFormRow, { Ingredient, IngredientError } from "./IngredientFormRow";

type Props = {
    ingredients: Ingredient[];
    setIngredients: (items: Ingredient[]) => void;
    errors?: IngredientError[];
};

export default function IngredientListEditor({ ingredients, setIngredients, errors = [] }: Props) {
    const flattenedProducts = flattenProductsDb(productsDb);

    const handleIngredientChange = (index: number, updated: Ingredient) => {
        const newIngredients = [...ingredients];
        newIngredients[index] = updated;
        setIngredients(newIngredients);
    };

    const handleIngredientRemove = (index: number) => {
        const newIngredients = ingredients.filter((_, i) => i !== index);
        setIngredients(newIngredients);
    };

    return (
        <div className="space-y-3">
            {ingredients.map((ingredient, index) => (
                <IngredientFormRow
                    key={index}
                    index={index}
                    ingredient={ingredient}
                    onChange={handleIngredientChange}
                    onRemove={handleIngredientRemove}
                    errors={errors?.[index] ?? {}}
                    productsDb={flattenedProducts}
                />
            ))}
        </div>
    );
}
