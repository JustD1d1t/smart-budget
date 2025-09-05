// src/components/ui/ConfirmModal.tsx
import clsx from "clsx";
import React, { useEffect, useRef, useState } from "react";

type Variant = "critical" | "success";

type Props = {
    open: boolean;
    onClose: () => void;

    title: React.ReactNode;
    description?: React.ReactNode;

    onConfirm: () => void | Promise<void>;

    variant?: Variant;           // "critical" | "success"
    confirmText?: string;        // domyślnie: "Potwierdź"
    cancelText?: string;         // domyślnie: "Anuluj"
    disableBackdropClose?: boolean; // domyślnie false
};

export default function ConfirmModal({
    open,
    onClose,
    title,
    description,
    onConfirm,
    variant = "critical",
    confirmText = "Potwierdź",
    cancelText = "Anuluj",
    disableBackdropClose = false,
}: Props) {
    const [loading, setLoading] = useState(false);
    const confirmBtnRef = useRef<HTMLButtonElement | null>(null);

    // focus na przycisk "Potwierdź" po otwarciu
    useEffect(() => {
        if (open) {
            const t = setTimeout(() => confirmBtnRef.current?.focus(), 0);
            return () => clearTimeout(t);
        }
    }, [open]);

    // ESC zamyka (o ile nie trwa akcja)
    useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape" && !loading) onClose();
        };
        document.addEventListener("keydown", onKey);
        return () => document.removeEventListener("keydown", onKey);
    }, [open, loading, onClose]);

    // blokada scrolla tła
    useEffect(() => {
        if (!open) return;
        const prev = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = prev;
        };
    }, [open]);

    const palette =
        variant === "critical"
            ? {
                ring: "ring-red-500",
                icon: "text-red-600",
                btn: "bg-red-600 hover:bg-red-700 focus:ring-red-500",
            }
            : {
                ring: "ring-green-600",
                icon: "text-green-600",
                btn: "bg-green-600 hover:bg-green-700 focus:ring-green-600",
            };

    const Icon = () =>
        variant === "critical" ? (
            <svg className={clsx("h-6 w-6", palette.icon)} viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        ) : (
            <svg className={clsx("h-6 w-6", palette.icon)} viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        );

    const handleBackdrop = () => {
        if (!disableBackdropClose && !loading) onClose();
    };

    const handleConfirm = async () => {
        try {
            setLoading(true);
            await onConfirm();
            onClose();
        } catch (e) {
            // błąd zostawiamy w gestii wywołującego (np. Toast)
            console.error("[ConfirmModal] onConfirm error:", e);
        } finally {
            setLoading(false);
        }
    };

    if (!open) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-title"
            aria-describedby={description ? "confirm-desc" : undefined}
        >
            {/* backdrop */}
            <div className="absolute inset-0 bg-black/50" onClick={handleBackdrop} />

            {/* panel */}
            <div
                className={clsx(
                    "relative z-10 w-full max-w-md rounded-xl bg-white p-5 shadow-xl ring-1",
                    palette.ring
                )}
            >
                <div className="flex items-start gap-3">
                    <Icon />
                    <div className="min-w-0">
                        <h2 id="confirm-title" className="text-base font-semibold">
                            {title}
                        </h2>
                        {description && (
                            <p id="confirm-desc" className="mt-1 text-sm text-gray-600">
                                {description}
                            </p>
                        )}
                    </div>
                </div>

                <div className="mt-5 flex items-center justify-end gap-2">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={loading}
                        className={clsx(
                            "inline-flex items-center rounded-md border px-3 py-2 text-sm",
                            "hover:bg-gray-50",
                            loading && "opacity-60 cursor-not-allowed"
                        )}
                    >
                        {cancelText}
                    </button>

                    <button
                        type="button"
                        ref={confirmBtnRef}
                        onClick={handleConfirm}
                        disabled={loading}
                        className={clsx(
                            "inline-flex items-center rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:ring-2",
                            palette.btn,
                            loading && "opacity-70 cursor-wait"
                        )}
                    >
                        {loading && (
                            <svg
                                className="mr-2 h-4 w-4 animate-spin"
                                viewBox="0 0 24 24"
                                aria-hidden
                            >
                                <circle
                                    className="opacity-25"
                                    cx="12"
                                    cy="12"
                                    r="10"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                    fill="none"
                                />
                                <path
                                    className="opacity-75"
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8v4A4 4 0 008 12H4z"
                                />
                            </svg>
                        )}
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}
