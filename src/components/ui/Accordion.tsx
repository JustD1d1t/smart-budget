import { ChevronDownIcon } from "@heroicons/react/24/solid";
import { useState } from "react";

interface AccordionProps {
    title: React.ReactNode;
    children: React.ReactNode;
    actions?: React.ReactNode;
    defaultOpen?: boolean;
}

const Accordion = ({ title, children, actions, defaultOpen = false }: AccordionProps) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <div className="border rounded mb-2">
            <div className="flex justify-between items-center p-4">
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="flex-grow text-left font-medium hover:bg-gray-100"
                >
                    <div className="flex justify-between items-center w-full">
                        {title}
                        <ChevronDownIcon
                            className={`h-5 w-5 transition-transform ${isOpen ? "rotate-180" : ""}`}
                        />
                    </div>
                </button>
                {actions && (
                    <div className="ml-2">
                        {actions}
                    </div>
                )}
            </div>
            {isOpen && <div className="px-4 pb-4">{children}</div>}
        </div>
    );
};

export default Accordion;

