import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { vi } from "vitest";
import ShoppingListDetailsPage from "../ShoppingListDetailsPage";

const insertMock = vi.fn().mockResolvedValue({
    data: [
        {
            id: "abc",
            name: "Masło",
            quantity: 1,
            unit: "szt",
            category: "inne",
            bought: false,
        },
    ],
});

const singleMock = vi.fn().mockResolvedValue({ data: { id: "1", name: "Moja Lista" } });

const selectMock = vi.fn((columns?: string) => {
    const query = {
        eq: vi.fn(() => query),
        or: vi.fn(() => Promise.resolve({ data: [] })),
        single: singleMock,
    };

    if (columns?.includes("id") && columns?.includes("name")) {
        return query;
    }

    if (columns === "*") {
        return {
            eq: () =>
                Promise.resolve({
                    data: [
                        { id: "1", name: "Masło", category: "nabiał", quantity: 2, unit: "szt", bought: false },
                        { id: "2", name: "Chleb", category: "pieczywo", quantity: 1, unit: "szt", bought: false },
                    ],
                }),
            or: vi.fn(() => Promise.resolve({ data: [] })),
        };
    }

    return query;
});

vi.mock("../../../lib/supabaseClient", () => {
    return {
        supabase: {
            from: (table: string) => {
                return {
                    select: selectMock,
                    insert: table === "shopping_items" ? insertMock : vi.fn().mockReturnThis(),
                };
            },
            auth: {
                getUser: vi.fn().mockResolvedValue({ data: { user: { id: "123" } } }),
            },
        },
    };
});

describe("ShoppingListDetailsPage", () => {
    it("renderuje szczegóły listy i komponenty", async () => {
        render(
            <MemoryRouter initialEntries={["/shopping-lists/1"]}>
                <Routes>
                    <Route path="/shopping-lists/:id" element={<ShoppingListDetailsPage />} />
                </Routes>
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(screen.getByText(/Szczegóły listy zakupowej/i)).toBeInTheDocument();
            expect(screen.getByText((content) => content.includes("Masło"))).toBeInTheDocument();
            expect(screen.getByText((content) => content.includes("Chleb"))).toBeInTheDocument();
        });
    });

    it("dodaje produkt do listy", async () => {
        render(
            <MemoryRouter initialEntries={["/shopping-lists/1"]}>
                <Routes>
                    <Route path="/shopping-lists/:id" element={<ShoppingListDetailsPage />} />
                </Routes>
            </MemoryRouter>
        );

        const nameInput = await screen.findByPlaceholderText("Wpisz produkt...");
        fireEvent.change(nameInput, { target: { value: "Masło" } });

        const quantityInput = screen.getByPlaceholderText("Ilość");
        fireEvent.change(quantityInput, { target: { value: "1" } });

        const addButton = screen.getByRole("button", { name: /dodaj produkt/i });
        fireEvent.click(addButton);

        await waitFor(() => {
            expect(insertMock).toHaveBeenCalled();
        });
    });
});
