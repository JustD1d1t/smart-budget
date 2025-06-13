import { fireEvent, render, screen } from "@testing-library/react";
import { vi } from "vitest";
import IngredientFormRow from "../IngredientFormRow";

describe("IngredientFormRow", () => {
    const productsDb = [
        { name: "mąka", category: "żywność" },
        { name: "cukier", category: "żywność" }
    ];

    const ingredient = {
        name: "mąka",
        quantity: 500,
        unit: "g"
    };

    const onChangeMock = vi.fn();
    const onRemoveMock = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("renders inputs with correct initial values", () => {
        render(
            <IngredientFormRow
                index={0}
                ingredient={ingredient}
                onChange={onChangeMock}
                onRemove={onRemoveMock}
                productsDb={productsDb}
            />
        );

        expect(screen.getByDisplayValue("mąka")).toBeInTheDocument();
        expect(screen.getByDisplayValue("500")).toBeInTheDocument();
        expect(screen.getByDisplayValue("g")).toBeInTheDocument();
    });

    it("calls onChange when name is changed", () => {
        render(
            <IngredientFormRow
                index={0}
                ingredient={ingredient}
                onChange={onChangeMock}
                onRemove={onRemoveMock}
                productsDb={productsDb}
            />
        );

        const nameInput = screen.getByDisplayValue("mąka");
        fireEvent.change(nameInput, { target: { value: "cukier" } });

        expect(onChangeMock).toHaveBeenCalledWith(0, {
            ...ingredient,
            name: "cukier"
        });
    });

    it("calls onChange when quantity is changed", () => {
        render(
            <IngredientFormRow
                index={0}
                ingredient={ingredient}
                onChange={onChangeMock}
                onRemove={onRemoveMock}
                productsDb={productsDb}
            />
        );

        const quantityInput = screen.getByDisplayValue("500");
        fireEvent.change(quantityInput, { target: { value: "750" } });

        expect(onChangeMock).toHaveBeenCalledWith(0, {
            ...ingredient,
            quantity: 750
        });
    });

    it("calls onChange when unit is changed", () => {
        render(
            <IngredientFormRow
                index={0}
                ingredient={ingredient}
                onChange={onChangeMock}
                onRemove={onRemoveMock}
                productsDb={productsDb}
            />
        );

        const unitSelect = screen.getByRole("combobox");
        fireEvent.change(unitSelect, { target: { value: "kg" } });

        expect(onChangeMock).toHaveBeenCalledWith(0, {
            ...ingredient,
            unit: "kg"
        });
    });

    it("calls onRemove when 'Usuń' button is clicked", () => {
        render(
            <IngredientFormRow
                index={0}
                ingredient={ingredient}
                onChange={onChangeMock}
                onRemove={onRemoveMock}
                productsDb={productsDb}
            />
        );

        fireEvent.click(screen.getByText("Usuń"));
        expect(onRemoveMock).toHaveBeenCalledWith(0);
    });

    it("renders error messages if provided", () => {
        render(
            <IngredientFormRow
                index={0}
                ingredient={{ ...ingredient, unit: "" }}
                onChange={onChangeMock}
                onRemove={onRemoveMock}
                productsDb={productsDb}
                errors={{
                    name: "Required",
                    quantity: "Invalid",
                    unit: "Select unit"
                }}
            />
        );

        expect(screen.getByText("Required")).toBeInTheDocument();
        expect(screen.getByText("Invalid")).toBeInTheDocument();
        expect(screen.getByText("Select unit")).toBeInTheDocument();
    });
});
