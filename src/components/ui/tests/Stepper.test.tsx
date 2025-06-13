import { render, screen } from "@testing-library/react";
import { Stepper } from "../Stepper";

describe("Stepper", () => {
    const steps = ["Krok 1", "Krok 2", "Krok 3"];

    it("renders all steps", () => {
        render(<Stepper steps={steps} currentStep={1} />);
        // Powinno być 3 kroki - numerowane od 1 do 3
        for (let i = 1; i <= steps.length; i++) {
            expect(screen.getByText(i.toString())).toBeInTheDocument();
        }
    });

    it("highlights the current step", () => {
        render(<Stepper steps={steps} currentStep={1} />);
        const activeStep = screen.getByText("2"); // currentStep = 1, czyli drugi krok (index 1)
        expect(activeStep).toHaveClass("bg-black");
        expect(activeStep).toHaveClass("text-white");
    });

    it("renders separators between steps", () => {
        render(<Stepper steps={steps} currentStep={0} />);
        // Kreska to div o klasie bg-gray-400 i wysokości 0.5 h-0.5
        const separators = document.querySelectorAll(".bg-gray-400");
        expect(separators.length).toBe(steps.length - 1);
    });
});
