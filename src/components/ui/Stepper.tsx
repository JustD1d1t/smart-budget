interface StepperProps {
    steps: string[];
    currentStep: number;
}

export const Stepper = ({ steps, currentStep }: StepperProps) => {
    return (
        <div className="flex gap-2 items-center">
            {steps.map((step, index) => (
                <div key={index} className="flex items-center gap-1">
                    <div
                        className={`w-6 h-6 rounded-full text-sm flex items-center justify-center ${index === currentStep
                                ? "bg-black text-white"
                                : "bg-gray-300 text-gray-800"
                            }`}
                    >
                        {index + 1}
                    </div>
                    {index < steps.length - 1 && <div className="w-4 h-0.5 bg-gray-400" />}
                </div>
            ))}
        </div>
    );
};
