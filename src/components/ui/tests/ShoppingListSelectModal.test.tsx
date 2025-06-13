// src/components/ui/tests/ShoppingListSelectModal.test.tsx

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { vi } from "vitest";

// Upewnij się, że ścieżka do supabaseClient jest poprawna względem tego pliku testowego!
// Jeśli plik jest w src/lib/supabaseClient.ts, to ta ścieżka jest ok:
vi.mock("../../../lib/supabaseClient", () => ({
    supabase: {
        from: vi.fn(() => ({
            select: vi.fn(() => Promise.resolve({ data: [], error: null })),
        })),
    },
}));

import ShoppingListSelectModal from "../ShoppingListSelectModal";

describe("ShoppingListSelectModal", () => {
    const onCloseMock = vi.fn();
    const onSelectMock = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("shows loading state", async () => {
        // Podmieniamy mock by select zwracał Promise, który się nie rozstrzyga (loading)
        const { supabase } = await import("../../../lib/supabaseClient");
        supabase.from.mockReturnValue({
            select: vi.fn(() => new Promise(() => { })),
        });

        render(
            <ShoppingListSelectModal
                isOpen={true}
                onClose={onCloseMock}
                onSelect={onSelectMock}
            />
        );

        expect(screen.getByText("Ładowanie...")).toBeInTheDocument();
    });

    it("shows empty state when no lists", async () => {
        const { supabase } = await import("../../../lib/supabaseClient");
        supabase.from.mockReturnValue({
            select: vi.fn(() => Promise.resolve({ data: [], error: null })),
        });

        render(
            <ShoppingListSelectModal
                isOpen={true}
                onClose={onCloseMock}
                onSelect={onSelectMock}
            />
        );

        await waitFor(() =>
            expect(screen.getByText("Brak dostępnych list.")).toBeInTheDocument()
        );
    });

    it("renders list buttons and handles click", async () => {
        const lists = [
            { id: "1", name: "Lista A" },
            { id: "2", name: "Lista B" },
        ];
        const { supabase } = await import("../../../lib/supabaseClient");
        supabase.from.mockReturnValue({
            select: vi.fn(() => Promise.resolve({ data: lists, error: null })),
        });

        render(
            <ShoppingListSelectModal
                isOpen={true}
                onClose={onCloseMock}
                onSelect={onSelectMock}
            />
        );

        for (const list of lists) {
            await waitFor(() =>
                expect(screen.getByText(list.name)).toBeInTheDocument()
            );
        }

        fireEvent.click(screen.getByText("Lista A"));
        expect(onSelectMock).toHaveBeenCalledWith("1");
        expect(onCloseMock).toHaveBeenCalled();
    });

    it("does not fetch lists when isOpen is false", async () => {
        const { supabase } = await import("../../../lib/supabaseClient");
        supabase.from.mockReturnValue({
            select: vi.fn(),
        });

        render(
            <ShoppingListSelectModal
                isOpen={false}
                onClose={onCloseMock}
                onSelect={onSelectMock}
            />
        );

        expect(supabase.from).not.toHaveBeenCalled();
    });
});
