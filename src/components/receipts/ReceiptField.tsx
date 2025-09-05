import React, { useEffect, useMemo, useState } from "react";

export const ACCEPT_ATTR = "image/png,image/jpeg,image/jpg,image/webp,image/gif";
export const SUPPORTED_EXT = /\.(png|jpe?g|webp|gif)$/i;

export type ExistingReceipt = {
    url: string;
    name?: string;
};

type Props = {
    label?: string;

    // Istniejący paragon (np. z Supabase) – pokaż miniaturę + przycisk Usuń
    existing?: ExistingReceipt | null;
    onDeleteExisting?: () => void;

    // Wybrany (nowy) plik – komponent jest KONTROLOWANY (trzymasz file w stanie strony)
    file: File | null;
    onFileChange: (file: File | null) => void;

    // Błędy/komunikaty z zewnątrz (opcjonalnie)
    errorText?: string;
    onError?: (msg: string) => void;

    // Ustawienia wyglądu
    accept?: string;            // domyślnie ACCEPT_ATTR
    previewHeight?: number;     // px – domyślnie 112 (h-28)
    lightboxMaxWidth?: number;  // px – domyślnie 640
};

export default function ReceiptField({
    label = "Paragon (jeden obraz)",
    existing = null,
    onDeleteExisting,
    file,
    onFileChange,
    errorText,
    onError,
    accept = ACCEPT_ATTR,
    previewHeight = 112,
    lightboxMaxWidth = 640,
}: Props) {
    const [preview, setPreview] = useState<string | null>(null);
    const [lightbox, setLightbox] = useState<{ src: string; alt: string } | null>(null);

    // objectURL dla wybranego pliku
    useEffect(() => {
        if (!file) {
            setPreview(null);
            return;
        }
        const url = URL.createObjectURL(file);
        setPreview(url);
        return () => URL.revokeObjectURL(url);
    }, [file]);

    // Esc zamyka lightbox
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => e.key === "Escape" && setLightbox(null);
        if (lightbox) document.addEventListener("keydown", onKey);
        return () => document.removeEventListener("keydown", onKey);
    }, [lightbox]);

    // style helper
    const previewStyle = useMemo<React.CSSProperties>(
        () => ({ height: `${previewHeight}px` }),
        [previewHeight]
    );

    const handleSelect = (f: File | null) => {
        if (!f) {
            onFileChange(null);
            return;
        }
        const ext = (f.name.split(".").pop() || "").toLowerCase();
        if (!SUPPORTED_EXT.test("." + ext)) {
            onError?.("Nieobsługiwany format obrazu.");
            onFileChange(null);
            return;
        }
        onFileChange(f);
    };

    return (
        <div className="space-y-2">
            <label className="text-sm font-medium">{label}</label>

            {/* Istniejący paragon (jeśli jest i nie ma wybranego nowego pliku) */}
            {!file && existing?.url && (
                <div className="relative w-full max-w-xs rounded-md border p-1">
                    <img
                        src={existing.url}
                        alt={existing.name || "Paragon"}
                        className="w-full object-cover rounded cursor-zoom-in"
                        style={previewStyle}
                        onClick={() => setLightbox({ src: existing.url, alt: existing.name || "Paragon" })}
                        onError={(e) => {
                            // Nie psuj layotu, jak URL wygasł
                            (e.currentTarget as HTMLImageElement).style.visibility = "hidden";
                        }}
                    />
                    <div className="mt-1 flex items-center justify-between gap-2">
                        <div className="text-xs text-gray-700 truncate">{existing.name || "paragon"}</div>
                        {onDeleteExisting && (
                            <button
                                type="button"
                                className="text-xs underline"
                                onClick={onDeleteExisting}
                                title="Usuń paragon"
                            >
                                Usuń
                            </button>
                        )}
                    </div>
                    <span className="absolute left-1.5 top-1.5 rounded bg-white/80 px-1.5 py-0.5 text-xs border">
                        zapisany
                    </span>
                </div>
            )}

            {/* Input pliku (pojedynczy) */}
            <input
                type="file"
                accept={accept}
                onChange={(e) => handleSelect(e.target.files?.[0] || null)}
                className="w-full rounded-md border px-3 py-2 text-sm"
            />

            {/* Podgląd nowo wybranego pliku */}
            {preview && (
                <div className="relative w-full max-w-xs">
                    <img
                        src={preview}
                        alt="Podgląd paragonu"
                        className="w-full object-cover rounded-md border cursor-zoom-in"
                        style={previewStyle}
                        onClick={() => setLightbox({ src: preview, alt: "Podgląd paragonu" })}
                    />
                    <button
                        type="button"
                        onClick={() => onFileChange(null)}
                        className="absolute -top-2 -right-2 rounded-full bg-white/90 border shadow px-2 py-1 text-xs hover:bg-white"
                        aria-label="Wyczyść"
                        title="Wyczyść"
                    >
                        ✕
                    </button>
                </div>
            )}

            {/* Błąd z zewnątrz */}
            {!!errorText && <div className="text-xs text-red-600">{errorText}</div>}

            {/* LIGHTBOX (max 70% wysokości okna + przycisk zamknięcia) */}
            {lightbox && (
                <div
                    className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
                    role="dialog"
                    aria-modal="true"
                    onClick={() => setLightbox(null)}
                >
                    <div
                        className="relative w-full"
                        style={{ maxWidth: `${lightboxMaxWidth}px` }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Kontener z limitem wysokości 70vh i przewijaniem w razie potrzeby */}
                        <div className="max-h-[70vh] overflow-auto rounded-lg shadow-xl bg-white/0">
                            <img
                                src={lightbox.src}
                                alt={lightbox.alt}
                                className="w-full h-auto object-contain"
                                style={{ maxHeight: "70vh" }}
                            />
                        </div>

                        {/* Przyciski zamykania */}
                        <button
                            type="button"
                            aria-label="Zamknij"
                            title="Zamknij"
                            onClick={() => setLightbox(null)}
                            className="absolute -top-3 -right-3 h-8 w-8 rounded-full bg-white text-black shadow grid place-items-center"
                        >
                            ✕
                        </button>

                        <div className="mt-3 flex justify-end">
                            <button
                                type="button"
                                onClick={() => setLightbox(null)}
                                className="rounded-md border px-3 py-1.5 text-sm bg-white hover:bg-gray-50 shadow"
                            >
                                Zamknij podgląd
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
