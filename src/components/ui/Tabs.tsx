import { useState } from "react";

interface TabsProps {
    labels: string[];
    children: React.ReactNode[];
}

export const Tabs = ({ labels, children }: TabsProps) => {
    const [active, setActive] = useState(0);

    return (
        <div>
            <div className="flex border-b mb-4">
                {labels.map((label, index) => (
                    <button
                        key={label}
                        className={`px-4 py-2 -mb-px border-b-2 ${index === active
                                ? "border-black font-semibold"
                                : "border-transparent text-gray-500"
                            }`}
                        onClick={() => setActive(index)}
                    >
                        {label}
                    </button>
                ))}
            </div>
            <div>{children[active]}</div>
        </div>
    );
};
