import { useEffect, useRef, useState } from "react";
import Input from "../ui/Input";

type Product = {
    name: string;
    category: string;
};

type Props = {
    productsDb: Product[];
    value: string;
    onChange: (val: string) => void;
    onClick: (name: string) => void;
    error?: string;
};

export default function ProductAutocomplete({
    productsDb,
    value,
    onChange,
    onClick,
    error
}: Props) {
    const [suggestions, setSuggestions] = useState<Product[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [hasFocus, setHasFocus] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const safeValue = value || "";

        if (safeValue.length < 3) {
            setSuggestions([]);
            setShowSuggestions(false);
            return;
        }

        const filtered = productsDb
            .filter((product) =>
                product.name.toLowerCase().includes(safeValue.toLowerCase())
            )
            .slice(0, 5);

        const hasExactMatch = filtered.some(
            (p) => p.name.toLowerCase() === safeValue.toLowerCase()
        );

        if (filtered.length < 5 && !hasExactMatch) {
            setSuggestions([{ name: safeValue, category: "inne" }, ...filtered]);
        } else {
            setSuggestions(filtered);
        }

        setShowSuggestions(!hasExactMatch && hasFocus);
    }, [value, productsDb, hasFocus]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setShowSuggestions(false);
                setHasFocus(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const setSelectedItem = (item: Product) => {
        onChange(item.name);
        onClick(item.name);
        setSuggestions([]);
        setShowSuggestions(false);
    };

    return (
        <div ref={wrapperRef} className="w-full relative">
            <Input
                type="text"
                placeholder="Wpisz produkt..."
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onFocus={() => setHasFocus(true)}
                error={error}
            />
            {showSuggestions && suggestions.length > 0 && (
                <ul className="mt-2 border rounded bg-white shadow absolute left-0 right-0 z-10" role="list">
                    {suggestions.map((product, idx) => (
                        <li
                            key={idx}
                            className="p-2 cursor-pointer hover:bg-gray-100"
                            onClick={() => setSelectedItem(product)}
                        >
                            {product.name}{" "}
                            <span className="text-sm text-gray-500">
                                ({product.category})
                            </span>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
