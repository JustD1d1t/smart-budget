import { fireEvent, render, screen } from "@testing-library/react";
import Modal from "../Modal";

describe("Modal", () => {
    it("renders children inside the portal", () => {
        render(
            <Modal onClose={() => { }}>
                <div>Modal content</div>
            </Modal>
        );

        expect(screen.getByText("Modal content")).toBeInTheDocument();
    });

    it("calls onClose when close button is clicked", () => {
        const onCloseMock = vi.fn();
        render(
            <Modal onClose={onCloseMock}>
                <div>Modal content</div>
            </Modal>
        );

        const closeButton = screen.getByRole("button", { name: "✕" });
        fireEvent.click(closeButton);

        expect(onCloseMock).toHaveBeenCalledTimes(1);
    });
});
