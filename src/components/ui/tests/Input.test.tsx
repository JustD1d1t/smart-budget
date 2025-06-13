import { fireEvent, render, screen } from "@testing-library/react";
import Input from "../Input";

describe("Input", () => {
    it("renders input field", () => {
        render(<Input placeholder="Wpisz coś" />);
        expect(screen.getByPlaceholderText("Wpisz coś")).toBeInTheDocument();
    });

    it("calls onChange handler", () => {
        const handleChange = vi.fn();
        render(<Input onChange={handleChange} />);
        fireEvent.change(screen.getByRole("textbox"), { target: { value: "123" } });
        expect(handleChange).toHaveBeenCalledTimes(1);
    });

    it("displays error message and styles", () => {
        render(<Input error="To pole jest wymagane" />);
        expect(screen.getByText("To pole jest wymagane")).toBeInTheDocument();
        const input = screen.getByRole("textbox");
        expect(input).toHaveClass("border-red-500");
    });
});
