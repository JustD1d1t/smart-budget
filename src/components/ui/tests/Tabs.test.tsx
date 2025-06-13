import { fireEvent, render, screen } from "@testing-library/react";
import { Tabs } from "../Tabs";

describe("Tabs", () => {
    const labels = ["Tab 1", "Tab 2", "Tab 3"];
    const children = [
        <div key="content1">Content 1</div>,
        <div key="content2">Content 2</div>,
        <div key="content3">Content 3</div>,
    ];

    it("renders all tab labels", () => {
        render(<Tabs labels={labels} children={children} />);
        labels.forEach((label) => {
            expect(screen.getByText(label)).toBeInTheDocument();
        });
    });

    it("shows the content of the first tab by default", () => {
        render(<Tabs labels={labels} children={children} />);
        expect(screen.getByText("Content 1")).toBeInTheDocument();
    });

    it("changes active tab content on click", () => {
        render(<Tabs labels={labels} children={children} />);

        // Kliknij drugi tab
        fireEvent.click(screen.getByText("Tab 2"));
        expect(screen.getByText("Content 2")).toBeInTheDocument();

        // Kliknij trzeci tab
        fireEvent.click(screen.getByText("Tab 3"));
        expect(screen.getByText("Content 3")).toBeInTheDocument();
    });
});
