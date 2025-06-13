import { fireEvent, render, screen } from "@testing-library/react";
import Select from "../Select";

describe("Select", () => {
    const options = ["Opcja 1", "Opcja 2", "Opcja 3"];

    it("renders with placeholder and options", () => {
        render(
            <Select value="" onChange={() => { }} options={options} placeholder="Wybierz opcję" />
        );

        expect(screen.getByRole("combobox")).toBeInTheDocument();
        expect(screen.getByRole("option", { name: "Wybierz opcję" })).toBeInTheDocument();
        options.forEach((opt) => {
            expect(screen.getByRole("option", { name: opt })).toBeInTheDocument();
        });
    });

    it("calls onChange when an option is selected", () => {
        const handleChange = vi.fn();
        render(<Select value="" onChange={handleChange} options={options} />);

        fireEvent.change(screen.getByRole("combobox"), { target: { value: "Opcja 2" } });
        expect(handleChange).toHaveBeenCalled();
    });

    it("displays error message and applies error styles", () => {
        render(
            <Select
                value=""
                onChange={() => { }}
                options={options}
                error="Błąd walidacji"
                className="custom-class"
            />
        );

        expect(screen.getByText("Błąd walidacji")).toBeInTheDocument();

        const select = screen.getByRole("combobox");
        expect(select).toHaveClass("border-red-500");
    });
});
