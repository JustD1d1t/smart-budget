// src/components/ui/Select.tsx

import clsx from "clsx";
import React, { ChangeEvent } from "react";

type Props = {
    value: string;
    onChange: (e: ChangeEvent<HTMLSelectElement>) => void;
    options: string[];
    placeholder?: string;
    className?: string;
    error?: string;
    ariaLabel?: string; // dodajemy prop do przekazania aria-label
} & React.SelectHTMLAttributes<HTMLSelectElement>;

export default function Select({
    value,
    onChange,
    options,
    placeholder = "-- wybierz --",
    className = "",
    error,
    ariaLabel,
    ...rest
}: Props) {
    return (
        <div>
            <select
                value={value}
                onChange={onChange}
                className={clsx(
                    "w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2",
                    error
                        ? "border-red-500 focus:ring-red-500"
                        : "border-gray-300 focus:ring-black",
                    className
                )}
                aria-label={ariaLabel} // przekazujemy aria-label do selecta
                {...rest} // przekazujemy pozostałe propsy do selecta
            >
                <option value="">{placeholder}</option>
                {options.map((option) => (
                    <option key={option} value={option}>
                        {option}
                    </option>
                ))}
            </select>
            {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
        </div>

    );
}
