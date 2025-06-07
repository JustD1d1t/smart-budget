import { ChangeEvent } from "react";

type Props = {
    value: string;
    onChange: (e: ChangeEvent<HTMLSelectElement>) => void;
    options: string[];
    placeholder?: string;
    className?: string;
};

export default function Select({
    value,
    onChange,
    options,
    placeholder = "-- wybierz --",
    className = "",
}: Props) {
    return (
        <select
            value={value}
            onChange={onChange}
            className={`border rounded px-3 py-2 ${className}`}
        >
            <option value="">{placeholder}</option>
            {options.map((option) => (
                <option key={option} value={option}>
                    {option}
                </option>
            ))}
        </select>
    );
}
