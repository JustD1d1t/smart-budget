import { useCallback } from "react";

type Props = React.InputHTMLAttributes<HTMLInputElement> & {
    value: string;
    onValueChange: (v: string) => void;
};

const sanitize = (raw: string) => {
    // zamień koma na kropkę
    let s = (raw || "").replace(/,/g, ".");
    // wywal wszystko poza cyframi i kropką
    s = s.replace(/[^0-9.]/g, "");
    // tylko jedna kropka
    const [head, ...rest] = s.split(".");
    return head + (rest.length ? "." + rest.join("").replace(/\./g, "") : "");
};

export default function DecimalInput({ value, onValueChange, ...rest }: Props) {
    const handleChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            onValueChange(sanitize(e.target.value));
        },
        [onValueChange]
    );

    const handlePaste = useCallback((e: React.ClipboardEvent<HTMLInputElement>) => {
        e.preventDefault();
        const text = e.clipboardData.getData("text");
        onValueChange(sanitize(text));
    }, [onValueChange]);

    const handleBeforeInput = useCallback((e: React.FormEvent<HTMLInputElement> & { data?: string }) => {
        // Chrome/Edge/Opera/Android/iOS: beforeinput pozwala zablokować pojedynczy wtręt
        const data = (e as any).data as string | undefined;
        if (!data) return;
        if (!/^[0-9.,]+$/.test(data)) {
            e.preventDefault();
        }
    }, []);

    const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
        const allowed =
            e.key.length === 1
                ? /[0-9.,]/.test(e.key)
                : [
                    "Backspace", "Delete", "ArrowLeft", "ArrowRight", "Home", "End", "Tab", "Enter",
                ].includes(e.key) ||
                (e.ctrlKey || e.metaKey); // pozwól skróty
        if (!allowed) e.preventDefault();
    }, []);

    return (
        <input
            {...rest}
            type="text"
            inputMode="decimal"
            autoComplete="off"
            enterKeyHint="done"
            value={value}
            onChange={handleChange}
            onPaste={handlePaste}
            onBeforeInput={handleBeforeInput}
            onKeyDown={handleKeyDown}
        />
    );
}
