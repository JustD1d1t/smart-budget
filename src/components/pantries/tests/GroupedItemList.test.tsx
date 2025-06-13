import { fireEvent, render, screen } from "@testing-library/react";
import { vi } from "vitest";
import GroupedItemList from "../GroupedItemList";

describe("GroupedItemList", () => {
    const items = [
        {
            id: "1",
            name: "Mleko",
            category: "żywność",
            quantity: 2,
            unit: "l"
        },
        {
            id: "2",
            name: "Chleb",
            category: "żywność",
            quantity: 1,
            unit: "szt"
        },
        {
            id: "3",
            name: "Płyn do naczyń",
            category: "chemia",
            quantity: 1,
            unit: "l"
        }
    ];

    const onEditMock = vi.fn();
    const onDeleteMock = vi.fn();

    beforeEach(() => {
        onEditMock.mockClear();
        onDeleteMock.mockClear();
    });

    it("renders grouped categories with correct counts", () => {
        render(<GroupedItemList items={items} onEdit={onEditMock} onDelete={onDeleteMock} />);

        expect(screen.getByText("żywność (2)")).toBeInTheDocument();
        expect(screen.getByText("chemia (1)")).toBeInTheDocument();
    });

    it("toggles group visibility on category click", () => {
        render(<GroupedItemList items={items} onEdit={onEditMock} onDelete={onDeleteMock} />);

        // Initially hidden
        expect(screen.queryByText("Mleko")).not.toBeInTheDocument();

        // Click to open 'żywność'
        fireEvent.click(screen.getByText("żywność (2)"));

        expect(screen.getByText("Mleko")).toBeInTheDocument();
        expect(screen.getByText("Chleb")).toBeInTheDocument();

        // Click again to close
        fireEvent.click(screen.getByText("żywność (2)"));
        expect(screen.queryByText("Mleko")).not.toBeInTheDocument();
    });

    it("calls onEdit when edit button is clicked", () => {
        render(<GroupedItemList items={items} onEdit={onEditMock} onDelete={onDeleteMock} />);
        fireEvent.click(screen.getByText("żywność (2)")); // open group

        fireEvent.click(screen.getAllByText("✏️ Edytuj")[0]);
        expect(onEditMock).toHaveBeenCalledWith(items[0]);
    });

    it("calls onDelete when delete button is clicked", () => {
        render(<GroupedItemList items={items} onEdit={onEditMock} onDelete={onDeleteMock} />);
        fireEvent.click(screen.getByText("żywność (2)")); // open group

        fireEvent.click(screen.getAllByText("🗑 Usuń")[1]); // for 'Chleb'
        expect(onDeleteMock).toHaveBeenCalledWith("2");
    });
});
