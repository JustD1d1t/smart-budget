import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { vi } from "vitest";
import ShoppingListsPage from "../ShoppingListsPage";

// Mock Zustand store
vi.mock("../../../stores/shoppingListStore", () => {
    return {
        useShoppingListStore: () => ({
            lists: [
                { id: "1", name: "Biedronka", user_id: "123" },
                { id: "2", name: "Dom na weekend", user_id: "123" },
            ],
            fetchLists: vi.fn().mockResolvedValue(undefined),
            addList: vi.fn(),
            removeList: vi.fn(),
        }),
    };
});

describe("ShoppingListsPage", () => {
    it("renderuje listy zakupowe", () => {
        render(
            <BrowserRouter>
                <ShoppingListsPage />
            </BrowserRouter>
        );

        expect(screen.getByText("Biedronka")).toBeInTheDocument();
        expect(screen.getByText("Dom na weekend")).toBeInTheDocument();
    });

    it("dodaje nową listę", async () => {
        render(
            <BrowserRouter>
                <ShoppingListsPage />
            </BrowserRouter>
        );

        const input = screen.getByPlaceholderText("Nazwa listy");
        fireEvent.change(input, { target: { value: "Nowa lista" } });

        const button = screen.getByRole("button", { name: /dodaj listę/i });
        fireEvent.click(button);

        await waitFor(() => {
            expect(input).toHaveValue(""); // Sprawdzamy, że input został wyczyszczony
        });
    });
});
