import { fireEvent, render, screen } from "@testing-library/react";
import Accordion from "../Accordion";

describe("Accordion", () => {
    it("renders the title", () => {
        render(<Accordion title="Test Title">Content</Accordion>);
        expect(screen.getByText("Test Title")).toBeInTheDocument();
    });

    it("does not show children by default", () => {
        render(<Accordion title="Test Title">Hidden Content</Accordion>);
        expect(screen.queryByText("Hidden Content")).not.toBeInTheDocument();
    });

    it("shows children when clicked", () => {
        render(<Accordion title="Click Me">Now Visible</Accordion>);
        fireEvent.click(screen.getByRole("button", { name: /click me/i }));
        expect(screen.getByText("Now Visible")).toBeInTheDocument();
    });

    it("shows children by default when defaultOpen is true", () => {
        render(
            <Accordion title="Open Title" defaultOpen>
                Visible from start
            </Accordion>
        );
        expect(screen.getByText("Visible from start")).toBeInTheDocument();
    });

    it("renders actions if provided", () => {
        render(
            <Accordion title="Title" actions={<button>Extra Action</button>}>
                Content
            </Accordion>
        );
        expect(screen.getByText("Extra Action")).toBeInTheDocument();
    });
});
