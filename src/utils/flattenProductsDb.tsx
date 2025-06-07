type Product = {
    name: string;
    category: string;
};

export const flattenProductsDb = (db: Record<string, string[]>): Product[] => {
    return Object.entries(db).flatMap(([category, items]) =>
        items.map((name) => ({ name, category }))
    );
};
