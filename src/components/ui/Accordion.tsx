import { ChevronDownIcon } from "@heroicons/react/24/solid";
import { useState } from "react";

interface AccordionProps {
    title: string;
    children: React.ReactNode;
    defaultOpen?: boolean;
}

const Accordion = ({ title, children, defaultOpen = false }: AccordionProps) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <div className="border rounded mb-2">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex justify-between items-center p-4 font-medium text-left hover:bg-gray-100"
            >
                {title}
                <ChevronDownIcon
                    className={`h-5 w-5 transition-transform ${isOpen ? "rotate-180" : ""}`}
                />
            </button>
            {isOpen && <div className="px-4 pb-4">{children}</div>}
        </div>
    );
};

export default Accordion;
