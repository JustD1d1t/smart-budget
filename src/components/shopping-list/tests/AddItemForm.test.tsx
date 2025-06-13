import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { vi } from "vitest";
import AddItemForm from "../AddItemForm";

vi.mock("../../../lib/supabaseClient", () => {
    return {
        supabase: {
            from: () => ({
                insert: vi.fn().mockImplementation((insertedItem) => ({
                    select: () => ({
                        single: () => ({
                            data: {
                                id: "123",
                                ...insertedItem,
                            },
                            error: null,
                        }),
                    }),
                })),
            }),
        },
    };
});



vi.mock("../../../utils/flattenProductsDb", () => ({
    flattenProductsDb: vi.fn(() => [
        { name: "mąka", category: "żywność" },
        { name: "cukier", category: "żywność" }
    ])
}));

describe("AddItemForm", () => {
    const onItemAddedMock = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("renders form fields", () => {
        render(<AddItemForm listId="abc123" />);
        expect(screen.getByPlaceholderText("Ilość")).toBeInTheDocument();
        expect(screen.getByRole("combobox")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Dodaj produkt" })).toBeInTheDocument();
    });

    it("shows validation errors when submitting empty form", async () => {
        render(<AddItemForm listId="abc123" />);
        fireEvent.click(screen.getByRole("button", { name: "Dodaj produkt" }));

        expect(await screen.findByText("Podaj nazwę produktu.")).toBeInTheDocument();
        expect(await screen.findByText("Podaj ilość.")).toBeInTheDocument();
    });

    it("calls onItemAdded and resets form on valid submission", async () => {
        render(<AddItemForm listId="abc123" onItemAdded={onItemAddedMock} />);

        fireEvent.change(screen.getByRole("textbox"), { target: { value: "mąka" } });
        fireEvent.change(screen.getByPlaceholderText("Ilość"), { target: { value: "1" } });

        fireEvent.click(screen.getByRole("button", { name: "Dodaj produkt" }));

        await waitFor(() => {
            expect(onItemAddedMock).toHaveBeenCalledWith(
                expect.objectContaining({
                    name: "mąka",
                    quantity: 1,
                    unit: "szt",
                    bought: false
                })
            );
        });

        expect(screen.getByRole("textbox")).toHaveValue("");
        expect(screen.getByPlaceholderText("Ilość")).toHaveValue(null); // pusty string = null
        expect(screen.getByRole("combobox")).toHaveValue("szt");
    });

    it("assigns default category if product not matched", async () => {
        render(<AddItemForm listId="abc123" onItemAdded={onItemAddedMock} />);

        fireEvent.change(screen.getByRole("textbox"), { target: { value: "niestandardowy" } });
        fireEvent.change(screen.getByPlaceholderText("Ilość"), { target: { value: "2" } });

        fireEvent.click(screen.getByRole("button", { name: "Dodaj produkt" }));

        await waitFor(() => {
            expect(onItemAddedMock).toHaveBeenCalledWith(
                expect.objectContaining({
                    name: "niestandardowy",
                    category: "inne"
                })
            );
        });
    });
});
