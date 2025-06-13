import { fireEvent, render, screen } from "@testing-library/react";
import { vi } from "vitest";
import ItemList from "../ItemList";

describe("ItemList", () => {
    const items = [
        {
            id: "1",
            name: "Mleko",
            category: "żywność",
            quantity: 2,
            unit: "l",
            expiry_date: "2025-12-31"
        },
        {
            id: "2",
            name: "Płyn",
            category: "chemia",
            quantity: 1,
            unit: "szt",
            expiry_date: null
        }
    ];

    const onEditMock = vi.fn();
    const onDeleteMock = vi.fn();
    const onQuantityChangeMock = vi.fn();

    beforeEach(() => {
        onEditMock.mockClear();
        onDeleteMock.mockClear();
        onQuantityChangeMock.mockClear();
    });

    it("renders all items with correct data", () => {
        render(
            <ItemList
                items={items}
                onEdit={onEditMock}
                onDelete={onDeleteMock}
                onQuantityChange={onQuantityChangeMock}
            />
        );

        expect(screen.getByText("Mleko")).toBeInTheDocument();
        expect(screen.getByText("Do: 2025-12-31")).toBeInTheDocument();
        expect(screen.getByText("Płyn")).toBeInTheDocument();
        expect(screen.getByText("żywność")).toBeInTheDocument();
        expect(screen.getByText("chemia")).toBeInTheDocument();
        expect(screen.getAllByText("✏️ Edytuj")).toHaveLength(2);
        expect(screen.getAllByText("🗑 Usuń")).toHaveLength(2);
    });

    it("calls onEdit when edit button is clicked", () => {
        render(
            <ItemList
                items={items}
                onEdit={onEditMock}
                onDelete={onDeleteMock}
                onQuantityChange={onQuantityChangeMock}
            />
        );

        fireEvent.click(screen.getAllByText("✏️ Edytuj")[0]);
        expect(onEditMock).toHaveBeenCalledWith(items[0]);
    });

    it("calls onDelete when delete button is clicked", () => {
        render(
            <ItemList
                items={items}
                onEdit={onEditMock}
                onDelete={onDeleteMock}
                onQuantityChange={onQuantityChangeMock}
            />
        );

        fireEvent.click(screen.getAllByText("🗑 Usuń")[1]);
        expect(onDeleteMock).toHaveBeenCalledWith("2");
    });

    it("calls onQuantityChange when ➕ is clicked", () => {
        render(
            <ItemList
                items={items}
                onEdit={onEditMock}
                onDelete={onDeleteMock}
                onQuantityChange={onQuantityChangeMock}
            />
        );

        fireEvent.click(screen.getAllByText("➕")[0]);
        expect(onQuantityChangeMock).toHaveBeenCalledWith("1", 3);
    });

    it("calls onQuantityChange when ➖ is clicked and does not go below 0", () => {
        render(
            <ItemList
                items={items}
                onEdit={onEditMock}
                onDelete={onDeleteMock}
                onQuantityChange={onQuantityChangeMock}
            />
        );

        fireEvent.click(screen.getAllByText("➖")[1]);
        expect(onQuantityChangeMock).toHaveBeenCalledWith("2", 0); // from 1 → 0
    });
});
