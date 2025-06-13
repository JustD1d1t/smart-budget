import { fireEvent, render, screen } from "@testing-library/react";
import { vi } from "vitest";
import ListItem from "../ListItem";

// Mock useNavigate z react-router
const navigateMock = vi.fn();
vi.mock("react-router-dom", () => ({
    useNavigate: () => navigateMock,
}));

describe("ListItem", () => {
    const list = {
        id: "abc123",
        name: "Lista na weekend",
        isOwner: true,
    };

    const onRemoveMock = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("renders list name and 'Otwórz' button", () => {
        render(<ListItem list={list} />);

        expect(screen.getByText("Lista na weekend")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Otwórz" })).toBeInTheDocument();
    });

    it("navigates to list details when 'Otwórz' is clicked", () => {
        render(<ListItem list={list} />);

        fireEvent.click(screen.getByRole("button", { name: "Otwórz" }));

        expect(navigateMock).toHaveBeenCalledWith("/shopping-lists/abc123");
    });

    it("calls onRemove when 'Usuń' is clicked", () => {
        render(<ListItem list={list} onRemove={onRemoveMock} />);

        fireEvent.click(screen.getByRole("button", { name: "Usuń" }));

        expect(onRemoveMock).toHaveBeenCalledWith("abc123");
    });

    it("does not render 'Usuń' button if onRemove is not provided", () => {
        render(<ListItem list={list} />);
        expect(screen.queryByRole("button", { name: "Usuń" })).not.toBeInTheDocument();
    });
});
