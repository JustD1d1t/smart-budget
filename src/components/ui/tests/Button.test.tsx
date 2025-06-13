import { fireEvent, render, screen } from "@testing-library/react";
import Button from "../Button";

describe("Button", () => {
    it("renders with default props", () => {
        render(<Button>Click me</Button>);
        expect(screen.getByText("Click me")).toBeInTheDocument();
    });

    it("applies primary variant by default", () => {
        render(<Button>Primary</Button>);
        const button = screen.getByText("Primary");
        expect(button).toHaveClass("bg-black");
    });

    it("applies outline variant", () => {
        render(<Button variant="outline">Outline</Button>);
        const button = screen.getByText("Outline");
        expect(button).toHaveClass("border");
    });

    it("applies danger variant", () => {
        render(<Button variant="danger">Danger</Button>);
        const button = screen.getByText("Danger");
        expect(button).toHaveClass("bg-red-600");
    });

    it("calls onClick when clicked", () => {
        const handleClick = vi.fn();
        render(<Button onClick={handleClick}>Click</Button>);
        fireEvent.click(screen.getByText("Click"));
        expect(handleClick).toHaveBeenCalledTimes(1);
    });
});
