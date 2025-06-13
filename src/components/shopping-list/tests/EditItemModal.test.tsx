import { fireEvent, render, screen } from "@testing-library/react";
import { vi } from "vitest";
import EditItemModal from "../EditItemModal";

// Mocks (jeśli Modal/Button są własne, możesz je też zmockować jeśli chcesz uprościć)

describe("EditItemModal", () => {
    const item = {
        id: "1",
        name: "Mleko",
        quantity: 2,
        unit: "l",
    };

    const onChangeMock = vi.fn();
    const onSaveMock = vi.fn();
    const onCloseMock = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("renders initial values", () => {
        render(
            <EditItemModal
                item={item}
                onChange={onChangeMock}
                onClose={onCloseMock}
                onSave={onSaveMock}
            />
        );

        expect(screen.getByDisplayValue("Mleko")).toBeInTheDocument();
        expect(screen.getByDisplayValue("2")).toBeInTheDocument();
        expect(screen.getByDisplayValue("l")).toBeInTheDocument();
        expect(screen.getByText("Zapisz")).toBeInTheDocument();
        expect(screen.getByText("Anuluj")).toBeInTheDocument();
    });

    it("calls onChange when name is edited", () => {
        render(
            <EditItemModal
                item={item}
                onChange={onChangeMock}
                onClose={onCloseMock}
                onSave={onSaveMock}
            />
        );

        const nameInput = screen.getByPlaceholderText("Nazwa produktu");
        fireEvent.change(nameInput, { target: { value: "Masło" } });

        expect(onChangeMock).toHaveBeenCalledWith({
            ...item,
            name: "Masło",
        });
    });

    it("calls onChange when quantity is edited", () => {
        render(
            <EditItemModal
                item={item}
                onChange={onChangeMock}
                onClose={onCloseMock}
                onSave={onSaveMock}
            />
        );

        const quantityInput = screen.getByPlaceholderText("Ilość");
        fireEvent.change(quantityInput, { target: { value: "5" } });

        expect(onChangeMock).toHaveBeenCalledWith({
            ...item,
            quantity: 5,
        });
    });

    it("calls onChange when unit is changed", () => {
        render(
            <EditItemModal
                item={item}
                onChange={onChangeMock}
                onClose={onCloseMock}
                onSave={onSaveMock}
            />
        );

        const unitSelect = screen.getByRole("combobox");
        fireEvent.change(unitSelect, { target: { value: "kg" } });

        expect(onChangeMock).toHaveBeenCalledWith({
            ...item,
            unit: "kg",
        });
    });

    it("calls onSave when 'Zapisz' button is clicked", () => {
        render(
            <EditItemModal
                item={item}
                onChange={onChangeMock}
                onClose={onCloseMock}
                onSave={onSaveMock}
            />
        );

        fireEvent.click(screen.getByText("Zapisz"));
        expect(onSaveMock).toHaveBeenCalled();
    });

    it("calls onClose when 'Anuluj' button is clicked", () => {
        render(
            <EditItemModal
                item={item}
                onChange={onChangeMock}
                onClose={onCloseMock}
                onSave={onSaveMock}
            />
        );

        fireEvent.click(screen.getByText("Anuluj"));
        expect(onCloseMock).toHaveBeenCalled();
    });
});
