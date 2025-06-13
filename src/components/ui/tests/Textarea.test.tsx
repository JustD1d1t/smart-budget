import { fireEvent, render, screen } from "@testing-library/react";
import Textarea from "../Textarea";

describe("Textarea", () => {
    it("renders textarea with placeholder", () => {
        render(<Textarea placeholder="Wpisz tekst" />);
        expect(screen.getByPlaceholderText("Wpisz tekst")).toBeInTheDocument();
    });

    it("calls onChange handler", () => {
        const handleChange = vi.fn();
        render(<Textarea onChange={handleChange} />);
        const textarea = screen.getByRole("textbox");
        fireEvent.change(textarea, { target: { value: "Nowa wartość" } });
        expect(handleChange).toHaveBeenCalled();
    });

    it("displays error message and applies error class", () => {
        render(<Textarea error="Błąd walidacji" />);
        expect(screen.getByText("Błąd walidacji")).toBeInTheDocument();
        const textarea = screen.getByRole("textbox");
        expect(textarea).toHaveClass("border-red-500");
    });
});
