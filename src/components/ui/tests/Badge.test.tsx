import { render, screen } from "@testing-library/react";
import Badge from "../Badge";

describe("Badge", () => {
    it("renders without crashing", () => {
        render(<Badge label="Nowość" />);
    });

    it("displays the correct label", () => {
        render(<Badge label="Promocja" />);
        expect(screen.getByText("Promocja")).toBeInTheDocument();
    });
});
