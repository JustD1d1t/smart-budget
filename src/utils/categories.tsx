export const CATEGORIES = [
    "żywność",
    "napoje",
    "restauracje",
    "rozrywka",
    "transport",
    "samochód",
    "mieszkanie",
    "media i rachunki",
    "chemia",
    "kosmetyki",
    "ubrania",
    "zdrowie",
    "sport",
    "edukacja",
    "prezenty",
    "zwierzęta",
    "podróże",
    "elektronika",
    "inne",
] as const;

export const PANTRY_ITEMS_CATEGORIES = [
    "żywność",
    "napoje",
    "chemia",
    "kosmetyki",
    "inne",
] as const;

export type Category = typeof CATEGORIES[number];