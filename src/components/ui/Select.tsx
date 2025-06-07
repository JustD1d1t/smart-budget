interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    options: { value: string; label: string }[];
}

export const Select = ({ options, ...props }: SelectProps) => {
    return (
        <select
            {...props}
            className="w-full p-2 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-black"
        >
            {options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                    {opt.label}
                </option>
            ))}
        </select>
    );
};
