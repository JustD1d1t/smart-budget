import React from "react";

type Props = {
    value: string;
    onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    options: string[];
    placeholder?: string;
    error?: string;
    disabled?: boolean;
};

export default function Select({
    value,
    onChange,
    options,
    placeholder = "-- wybierz --",
    error,
    disabled,
}: Props) {
    return (
        <div className="relative">
            <select
                value={value}
                onChange={onChange}
                disabled={disabled}
                className={[
                    // te same „bazowe” klasy co w Input
                    "w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm",
                    "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
                    // by strzałka systemowa nie psuła stylu
                    "appearance-none pr-10",
                    disabled ? "opacity-60 cursor-not-allowed" : "",
                    error ? "border-red-500" : "",
                ].join(" ")}
            >
                <option value="">{placeholder}</option>
                {options.map((o) => (
                    <option key={o} value={o}>
                        {o}
                    </option>
                ))}
            </select>

            <div className="pointer-events-none absolute inset-y-0 right-2 flex items-center">
                <svg
                    className="h-4 w-4 text-gray-500"
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden
                >
                    <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            </div>

            {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
        </div>
    );
}
