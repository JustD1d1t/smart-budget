import { fireEvent, render, screen } from "@testing-library/react";
import { vi } from "vitest";
import GroupedItemList from "../GroupedItemList";

// Mock Accordion to render content without actual toggle logic
vi.mock("../../ui/Accordion", () => ({
    __esModule: true,
    default: ({ children, title }: { children: React.ReactNode; title: string }) => (
        <div>
            <h2>{title}</h2>
            {children}
        </div>
    ),
}));

describe("GroupedItemList", () => {
    const items = [
        {
            id: "1",
            name: "Mleko",
            category: "Nabiał",
            quantity: 1,
            unit: "l",
            bought: false,
        },
        {
            id: "2",
            name: "Masło",
            category: "Nabiał",
            quantity: 2,
            unit: "opak",
            bought: true,
        },
        {
            id: "3",
            name: "Chleb",
            category: "Pieczywo",
            quantity: 1,
            unit: "szt",
            bought: false,
        },
    ];

    const onToggleMock = vi.fn();
    const onEditMock = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("groups and renders items by category", () => {
        render(
            <GroupedItemList
                items={items}
                filterCategory="all"
                onToggle={onToggleMock}
                onEdit={onEditMock}
            />
        );

        expect(screen.getByText("Nabiał")).toBeInTheDocument();
        expect(screen.getByText("Pieczywo")).toBeInTheDocument();
        expect(screen.getByText("Mleko (1 l)")).toBeInTheDocument();
        expect(screen.getByText("Masło (2 opak)")).toBeInTheDocument();
        expect(screen.getByText("Chleb (1 szt)")).toBeInTheDocument();
    });

    it("filters by selected category", () => {
        render(
            <GroupedItemList
                items={items}
                filterCategory="Nabiał"
                onToggle={onToggleMock}
                onEdit={onEditMock}
            />
        );

        expect(screen.getByText("Nabiał")).toBeInTheDocument();
        expect(screen.queryByText("Pieczywo")).not.toBeInTheDocument();
        expect(screen.queryByText("Chleb")).not.toBeInTheDocument();
    });

    it("calls onToggle when item is clicked", () => {
        render(
            <GroupedItemList
                items={items}
                filterCategory="all"
                onToggle={onToggleMock}
                onEdit={onEditMock}
            />
        );

        fireEvent.click(screen.getByText("Mleko (1 l)"));
        expect(onToggleMock).toHaveBeenCalledWith("1", false);

        fireEvent.click(screen.getByText("Masło (2 opak)"));
        expect(onToggleMock).toHaveBeenCalledWith("2", true);
    });

    it("calls onEdit when 'Edytuj' is clicked", () => {
        render(
            <GroupedItemList
                items={items}
                filterCategory="all"
                onToggle={onToggleMock}
                onEdit={onEditMock}
            />
        );

        fireEvent.click(screen.getAllByText("Edytuj")[0]);
        expect(onEditMock).toHaveBeenCalledWith(items[0]);
    });

    it("applies line-through style for bought items", () => {
        render(
            <GroupedItemList
                items={items}
                filterCategory="all"
                onToggle={onToggleMock}
                onEdit={onEditMock}
            />
        );

        const masloText = screen.getByText("Masło (2 opak)");
        expect(masloText).toHaveClass("line-through");
        expect(masloText).toHaveClass("text-gray-500");
    });
});
