import { fireEvent, render, screen } from "@testing-library/react";
import { vi } from "vitest";
import IngredientListEditor from "../IngredientListEditor";

vi.mock("../../../utils/flattenProductsDb", () => ({
    flattenProductsDb: vi.fn(() => [
        { name: "mąka", category: "żywność" },
        { name: "cukier", category: "żywność" }
    ])
}));

describe("IngredientListEditor", () => {
    const ingredients = [
        { name: "mąka", quantity: 500, unit: "g" },
        { name: "cukier", quantity: 300, unit: "g" }
    ];

    const errors = [
        { name: "Required", quantity: undefined, unit: undefined },
        {}
    ];

    const setIngredientsMock = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("renders all IngredientFormRow components", () => {
        render(
            <IngredientListEditor
                ingredients={ingredients}
                setIngredients={setIngredientsMock}
            />
        );

        expect(screen.getByDisplayValue("mąka")).toBeInTheDocument();
        expect(screen.getByDisplayValue("cukier")).toBeInTheDocument();
        expect(screen.getAllByRole("combobox")).toHaveLength(2);
    });

    it("passes correct errors to IngredientFormRow", () => {
        render(
            <IngredientListEditor
                ingredients={ingredients}
                setIngredients={setIngredientsMock}
                errors={errors}
            />
        );

        expect(screen.getByText("Required")).toBeInTheDocument();
    });

    it("calls setIngredients on ingredient change", () => {
        render(
            <IngredientListEditor
                ingredients={ingredients}
                setIngredients={setIngredientsMock}
            />
        );

        const input = screen.getByDisplayValue("mąka");
        fireEvent.change(input, { target: { value: "kasza" } });

        expect(setIngredientsMock).toHaveBeenCalledWith([
            { name: "kasza", quantity: 500, unit: "g" },
            { name: "cukier", quantity: 300, unit: "g" }
        ]);
    });

    it("calls setIngredients on ingredient removal", () => {
        render(
            <IngredientListEditor
                ingredients={ingredients}
                setIngredients={setIngredientsMock}
            />
        );

        fireEvent.click(screen.getAllByText("Usuń")[0]);

        expect(setIngredientsMock).toHaveBeenCalledWith([
            { name: "cukier", quantity: 300, unit: "g" }
        ]);
    });
});
