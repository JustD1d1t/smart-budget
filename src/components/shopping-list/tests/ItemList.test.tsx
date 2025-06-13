import { fireEvent, render, screen } from "@testing-library/react";
import { vi } from "vitest";
import ItemList from "../ItemList";

describe("ItemList", () => {
    const items = [
        {
            id: "1",
            name: "Mleko",
            category: "Nabiał",
            quantity: 2,
            unit: "l",
            bought: false,
            recipe: "",
        },
        {
            id: "2",
            name: "Masło",
            category: "Nabiał",
            quantity: 1,
            unit: "opak",
            bought: true,
            recipe: "ciasto",
        },
    ];

    const onToggleMock = vi.fn();
    const onEditMock = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("renders all items with category, unit and recipe if provided", () => {
        render(<ItemList items={items} onToggle={onToggleMock} onEdit={onEditMock} />);
        expect(screen.getByText("Mleko (Nabiał) - 2 l")).toBeInTheDocument();
        expect(screen.getByText("Masło (Nabiał) - 1 opak (ciasto)")).toBeInTheDocument();
    });

    it("applies line-through class for bought items", () => {
        render(<ItemList items={items} onToggle={onToggleMock} onEdit={onEditMock} />);
        const boughtItem = screen.getByText("Masło (Nabiał) - 1 opak (ciasto)");
        expect(boughtItem).toHaveClass("line-through");
        expect(boughtItem).toHaveClass("text-gray-500");
    });

    it("calls onToggle when item is clicked", () => {
        render(<ItemList items={items} onToggle={onToggleMock} onEdit={onEditMock} />);
        fireEvent.click(screen.getByText("Mleko (Nabiał) - 2 l"));
        expect(onToggleMock).toHaveBeenCalledWith("1", false);
    });

    it("calls onEdit when 'Edytuj' button is clicked for each item", () => {
        render(<ItemList items={items} onToggle={onToggleMock} onEdit={onEditMock} />);
        // Kliknij Edytuj przy Mleko
        const mlekoLi = screen.getByText("Mleko (Nabiał) - 2 l").closest("li");
        const mlekoEditBtn = mlekoLi?.querySelector("button");
        expect(mlekoEditBtn).toBeInTheDocument();
        fireEvent.click(mlekoEditBtn!);
        expect(onEditMock).toHaveBeenCalledWith(items[0]);

        // Kliknij Edytuj przy Masło
        const masloLi = screen.getByText("Masło (Nabiał) - 1 opak (ciasto)").closest("li");
        const masloEditBtn = masloLi?.querySelector("button");
        expect(masloEditBtn).toBeInTheDocument();
        fireEvent.click(masloEditBtn!);
        expect(onEditMock).toHaveBeenCalledWith(items[1]);
    });
});
