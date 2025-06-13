import { render, screen } from "@testing-library/react";
import { vi } from "vitest";
import Toast from "../Toast";

describe("Toast", () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.runOnlyPendingTimers();
        vi.useRealTimers();
    });

    it("renders message with correct type class", () => {
        const { rerender } = render(
            <Toast message="Info message" type="info" onClose={() => { }} />
        );
        expect(screen.getByText("Info message")).toHaveClass("bg-blue-500");

        rerender(<Toast message="Success message" type="success" onClose={() => { }} />);
        expect(screen.getByText("Success message")).toHaveClass("bg-green-500");

        rerender(<Toast message="Error message" type="error" onClose={() => { }} />);
        expect(screen.getByText("Error message")).toHaveClass("bg-red-500");
    });

    it("calls onClose after duration", () => {
        const onClose = vi.fn();

        render(
            <Toast message="Test message" duration={2000} onClose={onClose} />
        );

        // Przed upływem czasu onClose nie powinno być wywołane
        vi.advanceTimersByTime(1999);
        expect(onClose).not.toHaveBeenCalled();

        // Po czasie duration onClose powinno być wywołane
        vi.advanceTimersByTime(1);
        expect(onClose).toHaveBeenCalledTimes(1);
    });
});
