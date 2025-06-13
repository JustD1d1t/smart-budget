import { render, screen } from "@testing-library/react";
import Card from "../Card";

describe("Card", () => {
    it("renders without crashing", () => {
        render(<Card>Treść karty</Card>);
        expect(screen.getByText("Treść karty")).toBeInTheDocument();
    });

    it("applies custom className", () => {
        render(<Card className="test-class">Zawartość</Card>);
        const card = screen.getByTestId("card");
        expect(card).toHaveClass("test-class");
    });
});
