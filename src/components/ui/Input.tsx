import React from "react";

type Props = React.InputHTMLAttributes<HTMLInputElement> & {
    error?: string;
};

export default function Input({ error, className = "", type = "text", ...rest }: Props) {
    const base =
        "w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500";

    // dla date — ujednolicenie wysokości + wyglądu
    const dateFix =
        type === "date"
            ? "appearance-none h-10 [&::-webkit-calendar-picker-indicator]:cursor-pointer"
            : "";

    return (
        <div>
            <input type={type} className={[base, dateFix, className].join(" ")} {...rest} />
            {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
        </div>
    );
}
