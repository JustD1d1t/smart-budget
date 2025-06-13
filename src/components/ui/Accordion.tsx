import { ChevronDownIcon } from "@heroicons/react/24/solid";
import { useState } from "react";

interface AccordionProps {
    title: React.ReactNode;
    children: React.ReactNode;
    actions?: React.ReactNode;
    defaultOpen?: boolean;
}

const Accordion = ({
    title,
    children,
    actions,
    defaultOpen = false,
}: AccordionProps) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <div className="border rounded-xl mb-3 bg-white shadow-sm">
            {/* Nagłówek */}
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="
          w-full flex items-center justify-between gap-2 px-3 py-3 
          sm:px-4 sm:py-4 
          font-medium text-base 
          hover:bg-gray-100 active:bg-gray-200 transition
          rounded-t-xl
        "
                aria-expanded={isOpen}
            >
                <span className="flex-1 text-left">{title}</span>
                <ChevronDownIcon
                    className={`h-6 w-6 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
                />
            </button>

            {/* Akcje — na mobile pod tytułem, na desktopie obok */}
            {actions && (
                <div
                    className="
            px-3 pb-2 sm:pb-0 sm:px-4
            flex sm:block justify-end 
            sm:absolute sm:right-4 sm:top-4
            text-sm
          "
                >
                    {actions}
                </div>
            )}

            {/* Treść */}
            <div
                className={`overflow-hidden transition-[max-height] duration-300 ease-in-out ${isOpen ? "max-h-[1000px] pb-3 px-3 sm:px-4" : "max-h-0"
                    }`}
                style={{ transitionProperty: "max-height" }}
            >
                {isOpen && <div>{children}</div>}
            </div>
        </div>
    );
};

export default Accordion;
