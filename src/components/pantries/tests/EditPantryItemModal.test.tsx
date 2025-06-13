import { fireEvent, render, screen } from "@testing-library/react";
import { vi } from "vitest";
import { PantryItem } from "../../../types";
import EditPantryItemModal from "../EditPantryItemModal";

describe("EditPantryItemModal", () => {
    const item: PantryItem = {
        id: "item-1",
        name: "Mleko",
        category: "żywność",
        quantity: 2,
        unit: "szt",
        expiry_date: "2025-12-31"
    };

    const onChangeMock = vi.fn();
    const onSaveMock = vi.fn();
    const onCloseMock = vi.fn();

    beforeEach(() => {
        render(
            <EditPantryItemModal
                item={item}
                onChange={onChangeMock}
                onSave={onSaveMock}
                onClose={onCloseMock}
            />
        );
    });

    it("renders all fields with initial values", () => {
        expect(screen.getByDisplayValue("Mleko")).toBeInTheDocument();
        expect(screen.getByDisplayValue("żywność")).toBeInTheDocument();
        expect(screen.getByDisplayValue("2")).toBeInTheDocument();
        expect(screen.getByDisplayValue("szt")).toBeInTheDocument();
        expect(screen.getByDisplayValue("2025-12-31")).toBeInTheDocument();
    });

    it("calls onChange when name is updated", () => {
        const input = screen.getByPlaceholderText("Nazwa produktu");
        fireEvent.change(input, { target: { value: "Masło" } });

        expect(onChangeMock).toHaveBeenCalledWith({
            ...item,
            name: "Masło"
        });
    });

    it("calls onChange when category is updated", () => {
        const categorySelect = screen.getByLabelText("Kategoria");
        fireEvent.change(categorySelect, { target: { value: "chemia" } });

        expect(onChangeMock).toHaveBeenCalledWith({
            ...item,
            category: "chemia"
        });
    });

    it("calls onChange when quantity is updated", () => {
        const quantityInput = screen.getByPlaceholderText("Ilość");
        fireEvent.change(quantityInput, { target: { value: "5" } });

        expect(onChangeMock).toHaveBeenCalledWith({
            ...item,
            quantity: 5
        });
    });

    it("calls onChange when unit is updated", () => {
        const unitSelect = screen.getByLabelText("Jednostka");
        fireEvent.change(unitSelect, { target: { value: "kg" } });

        expect(onChangeMock).toHaveBeenCalledWith({
            ...item,
            unit: "kg"
        });
    });

    it("calls onChange when expiry date is updated", () => {
        const dateInput = screen.getByDisplayValue("2025-12-31");
        fireEvent.change(dateInput, { target: { value: "2026-01-01" } });

        expect(onChangeMock).toHaveBeenCalledWith({
            ...item,
            expiry_date: "2026-01-01"
        });
    });

    it("calls onSave when save button is clicked", () => {
        fireEvent.click(screen.getByText("💾 Zapisz"));
        expect(onSaveMock).toHaveBeenCalled();
    });

    it("calls onClose when cancel button is clicked", () => {
        fireEvent.click(screen.getByText("Anuluj"));
        expect(onCloseMock).toHaveBeenCalled();
    });
});
