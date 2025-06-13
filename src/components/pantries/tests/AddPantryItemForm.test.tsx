import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { vi } from "vitest";
import AddPantryItemForm from "../AddPantryItemForm";

vi.mock("../../../lib/supabaseClient", () => ({
    supabase: {
        from: () => ({
            insert: () => ({
                select: () => ({
                    single: () => ({
                        data: {
                            id: "1",
                            name: "Test product",
                            category: "food",
                            quantity: 2,
                            unit: "kg",
                            expiry_date: "2025-12-31"
                        },
                        error: null
                    })
                })
            })
        })
    }
}));

describe("AddPantryItemForm", () => {
    const onItemAddedMock = vi.fn();

    beforeEach(() => {
        render(<AddPantryItemForm pantryId="pantry-123" onItemAdded={onItemAddedMock} />);
    });

    it("shows validation errors for empty required fields", async () => {
        fireEvent.click(screen.getByText("➕ Dodaj produkt"));

        expect(await screen.findByText("Nazwa produktu jest wymagana.")).toBeInTheDocument();
        expect(await screen.findByText("Wybierz kategorię.")).toBeInTheDocument();
        expect(await screen.findByText("Wybierz jednostkę.")).toBeInTheDocument();
    });

    it("calls onItemAdded with form data after valid submission", async () => {
        fireEvent.change(screen.getByPlaceholderText("Nazwa produktu"), {
            target: { value: "Test product" }
        });

        const selects = screen.getAllByRole("combobox");
        fireEvent.change(selects[0], { target: { value: "żywność" } }); // category
        fireEvent.change(screen.getByPlaceholderText("Ilość"), {
            target: { value: "2" }
        });
        fireEvent.change(selects[1], { target: { value: "kg" } }); // unit

        fireEvent.change(screen.getByPlaceholderText("Data przydatności (opcjonalna)"), {
            target: { value: "2025-12-31" }
        });

        fireEvent.click(screen.getByText("➕ Dodaj produkt"));

        await waitFor(() => {
            expect(onItemAddedMock).toHaveBeenCalledWith({
                id: "1",
                name: "Test product",
                category: "food",
                quantity: 2,
                unit: "kg",
                expiry_date: "2025-12-31"
            });
        });
    });

    it("resets form fields after successful submission", async () => {
        fireEvent.change(screen.getByPlaceholderText("Nazwa produktu"), {
            target: { value: "Test product" }
        });

        const selects = screen.getAllByRole("combobox");
        fireEvent.change(selects[0], { target: { value: "żywność" } });
        fireEvent.change(screen.getByPlaceholderText("Ilość"), {
            target: { value: "2" }
        });
        fireEvent.change(selects[1], { target: { value: "kg" } });

        fireEvent.click(screen.getByText("➕ Dodaj produkt"));

        await waitFor(() => {
            expect(screen.getByPlaceholderText("Nazwa produktu")).toHaveValue("");
            expect(screen.getAllByRole("combobox")[0]).toHaveValue(""); // category
            expect(screen.getByPlaceholderText("Ilość")).toHaveValue(1);
            expect(screen.getAllByRole("combobox")[1]).toHaveValue(""); // unit
            expect(screen.getByPlaceholderText("Data przydatności (opcjonalna)")).toHaveValue("");
        });
    });
});
