import { fireEvent, render, screen } from "@testing-library/react";
import { vi } from "vitest";
import ExpenseItem from "../ExpenseItem";

describe("ExpenseItem", () => {
    const expense = {
        id: "1",
        store: "Biedronka",
        amount: 12.5,
        date: "2023-06-01",
        category: "żywność",
    };

    it("renders expense data correctly", () => {
        render(
            <ExpenseItem
                expense={expense}
                onEdit={() => { }}
                onDelete={() => { }}
            />
        );

        expect(screen.getByText("Biedronka")).toBeInTheDocument();
        expect(screen.getByText("12.50 zł")).toBeInTheDocument();
        expect(screen.getByText("2023-06-01")).toBeInTheDocument();
        expect(screen.getByText("żywność")).toBeInTheDocument();
    });

    it("calls onEdit when edit button clicked", () => {
        const onEditMock = vi.fn();
        render(
            <ExpenseItem expense={expense} onEdit={onEditMock} onDelete={() => { }} />
        );

        fireEvent.click(screen.getByText("✏️ Edytuj"));
        expect(onEditMock).toHaveBeenCalledWith("1");
    });

    it("calls onDelete when delete button clicked", () => {
        const onDeleteMock = vi.fn();
        render(
            <ExpenseItem expense={expense} onEdit={() => { }} onDelete={onDeleteMock} />
        );

        fireEvent.click(screen.getByText("🗑 Usuń"));
        expect(onDeleteMock).toHaveBeenCalledWith("1");
    });

    it("does not render edit button if onEdit is not provided", () => {
        render(<ExpenseItem expense={expense} onDelete={() => { }} />);
        expect(screen.queryByText("✏️ Edytuj")).not.toBeInTheDocument();
    });

    it("does not render delete button if onDelete is not provided", () => {
        render(<ExpenseItem expense={expense} onEdit={() => { }} />);
        expect(screen.queryByText("🗑 Usuń")).not.toBeInTheDocument();
    });
});
