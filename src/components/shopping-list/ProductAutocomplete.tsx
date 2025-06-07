import { useEffect, useState } from "react";

type Product = {
    name: string;
    category: string;
};

type Props = {
    productsDb: Product[];
    value: string;
    onChange: (value: string) => void;
    onSelect: (productName: string) => void;
};

export default function ProductAutocomplete({
    productsDb,
    value,
    onChange,
    onSelect,
}: Props) {
    const [suggestions, setSuggestions] = useState<Product[]>([]);

    useEffect(() => {
        if (value.length < 3) {
            setSuggestions([]);
            return;
        }

        const filtered = productsDb
            .filter((product) =>
                product.name.toLowerCase().includes(value.toLowerCase())
            )
            .slice(0, 5);

        // Jeśli jest mniej niż 5 wyników i brak dokładnej zgodności – dodaj opcję niestandardową
        const hasExactMatch = filtered.some(
            (p) => p.name.toLowerCase() === value.toLowerCase()
        );

        if (filtered.length < 5 && !hasExactMatch) {
            setSuggestions([
                { name: value, category: "niestandardowy wpis" },
                ...filtered,
            ]);
        } else {
            setSuggestions(filtered);
        }
    }, [value, productsDb]);

    return (
        <div className="w-full relative">
            <input
                type="text"
                className="w-full border rounded p-2"
                placeholder="Wpisz produkt..."
                value={value}
                onChange={(e) => onChange(e.target.value)}
            />
            {suggestions.length > 0 && (
                <ul className="absolute left-0 right-0 mt-1 border rounded bg-white shadow z-10">
                    {suggestions.map((product, idx) => (
                        <li
                            key={idx}
                            className="p-2 cursor-pointer hover:bg-gray-100"
                            onClick={() => {
                                onSelect(product.name);
                                onChange(product.name);
                                setSuggestions([]);
                            }}
                        >
                            {product.name} <span className="text-sm text-gray-500">({product.category})</span>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
