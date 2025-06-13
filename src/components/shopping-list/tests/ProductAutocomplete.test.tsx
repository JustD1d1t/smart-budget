import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { vi } from "vitest";
import ProductAutocomplete from "../ProductAutocomplete";

describe("ProductAutocomplete", () => {
    const productsDb = [
        { name: "mąka", category: "żywność" },
        { name: "makaron", category: "żywność" },
        { name: "masło", category: "nabiał" },
    ];

    const onChangeMock = vi.fn();
    const onClickMock = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("does not show suggestions if input has fewer than 3 characters", async () => {
        render(
            <ProductAutocomplete
                productsDb={productsDb}
                value="ma"
                onChange={onChangeMock}
                onClick={onClickMock}
            />
        );

        fireEvent.focus(screen.getByPlaceholderText("Wpisz produkt..."));
        expect(screen.queryByRole("list")).not.toBeInTheDocument();
    });

    it("shows filtered suggestions when input has 3+ characters and focused", async () => {
        render(
            <ProductAutocomplete
                productsDb={productsDb}
                value="mak"
                onChange={onChangeMock}
                onClick={onClickMock}
            />
        );

        fireEvent.focus(screen.getByPlaceholderText("Wpisz produkt..."));

        await waitFor(() => {
            expect(screen.getByText("makaron")).toBeInTheDocument();
        });
    });

    it("adds custom entry when no exact match exists", async () => {
        render(
            <ProductAutocomplete
                productsDb={productsDb}
                value="makrela"
                onChange={onChangeMock}
                onClick={onClickMock}
            />
        );

        fireEvent.focus(screen.getByPlaceholderText("Wpisz produkt..."));

        await waitFor(() => {
            expect(screen.getByText("makrela")).toBeInTheDocument();
            expect(screen.getByText("(inne)")).toBeInTheDocument();
        });
    });

    it("hides suggestions if exact match is found", async () => {
        render(
            <ProductAutocomplete
                productsDb={productsDb}
                value="masło"
                onChange={onChangeMock}
                onClick={onClickMock}
            />
        );

        fireEvent.focus(screen.getByPlaceholderText("Wpisz produkt..."));

        await waitFor(() => {
            expect(screen.queryByRole("list")).not.toBeInTheDocument();
        });
    });

    it("calls onClick and onChange when suggestion is clicked", async () => {
        render(
            <ProductAutocomplete
                productsDb={productsDb}
                value="mak"
                onChange={onChangeMock}
                onClick={onClickMock}
            />
        );

        fireEvent.focus(screen.getByPlaceholderText("Wpisz produkt..."));

        await waitFor(() => {
            expect(screen.getByText("makaron")).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText("makaron"));

        expect(onChangeMock).toHaveBeenCalledWith("makaron");
        expect(onClickMock).toHaveBeenCalledWith("makaron");
    });

    it("renders error message if provided", () => {
        render(
            <ProductAutocomplete
                productsDb={productsDb}
                value=""
                onChange={onChangeMock}
                onClick={onClickMock}
                error="To pole jest wymagane"
            />
        );

        expect(screen.getByText("To pole jest wymagane")).toBeInTheDocument();
    });
});
