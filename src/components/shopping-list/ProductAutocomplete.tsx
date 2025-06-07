import { useEffect, useState } from "react";

type Product = {
    name: string;
    category: string;
};

type Props = {
    productsDb: Product[];
    onSelect: (productName: string) => void;
};

export default function ProductAutocomplete({ productsDb, onSelect }: Props) {
    const [query, setQuery] = useState("");
    const [suggestions, setSuggestions] = useState<Product[]>([]);

    useEffect(() => {
        if (query.length < 3) {
            setSuggestions([]);
            return;
        }

        const filtered = productsDb
            .filter((product) =>
                product.name.toLowerCase().includes(query.toLowerCase())
            )
            .slice(0, 5);

        // Jeśli jest mniej niż 5 wyników i brak dokładnej zgodności – dodaj opcję niestandardową
        const hasExactMatch = filtered.some(
            (p) => p.name.toLowerCase() === query.toLowerCase()
        );

        if (filtered.length < 5 && !hasExactMatch) {
            setSuggestions([
                { name: query, category: "niestandardowy wpis" },
                ...filtered,
            ]);
        } else {
            setSuggestions(filtered);
        }
    }, [query, productsDb]);

    return (
        <div className="w-full max-w-md">
            <input
                type="text"
                className="w-full border rounded p-2"
                placeholder="Wpisz produkt..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
            />
            {suggestions.length > 0 && (
                <ul className="mt-2 border rounded bg-white shadow">
                    {suggestions.map((product, idx) => (
                        <li
                            key={idx}
                            className="p-2 cursor-pointer hover:bg-gray-100"
                            onClick={() => {
                                onSelect(product.name);
                                setQuery(""); // reset inputa po wyborze
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
