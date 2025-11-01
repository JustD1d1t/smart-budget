// src/components/utilities/EanScanner.tsx
import { BrowserMultiFormatReader } from "@zxing/browser";
import { NotFoundException } from "@zxing/library"; // ✅ ważne
import { useEffect, useRef, useState } from "react";
import Button from "../ui/Button";
import Modal from "../ui/Modal";

type Props = {
    open: boolean;
    onClose: () => void;
    onDetected: (ean: string) => void;
};

export default function EanScanner({ open, onClose, onDetected }: Props) {
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const readerRef = useRef<BrowserMultiFormatReader | null>(null);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!open) return;

        const setup = async () => {
            setError("");
            const reader = new BrowserMultiFormatReader();
            readerRef.current = reader;

            try {
                const devices = await BrowserMultiFormatReader.listVideoInputDevices();
                if (!devices.length) {
                    setError("Nie wykryto kamery.");
                    return;
                }

                const deviceId = devices[0].deviceId;
                await reader.decodeFromVideoDevice(deviceId, videoRef.current!, (result, err) => {
                    if (result) {
                        const code = result.getText().trim();
                        // akceptujemy EAN-8 (8 cyfr) i EAN-13 (13 cyfr)
                        if (/^\d{8}$|^\d{13}$/.test(code)) {
                            onDetected(code);
                        }
                    } else if (err && !(err instanceof NotFoundException)) {
                        // inne błędy logujemy (NotFoundException == brak kodu w klatce — normalne)
                        console.warn(err);
                    }
                });
            } catch (e: any) {
                console.error(e);
                setError("Błąd inicjalizacji kamery lub brak uprawnień.");
            }
        };

        setup();

        return () => {
            try {
                readerRef.current?.reset();
            } catch { }
        };
    }, [open, onDetected]);

    if (!open) return null;

    return (
        <Modal onClose={onClose}>
            <div className="space-y-4">
                <h3 className="text-lg font-semibold">Zeskanuj kod EAN</h3>

                {error && <p className="text-sm text-red-600">{error}</p>}

                <div className="rounded overflow-hidden bg-black flex justify-center">
                    <video ref={videoRef} className="w-[90%] max-w-[640px]" autoPlay muted playsInline />
                </div>

                <div className="flex justify-end">
                    <Button variant="ghost" onClick={onClose}>
                        Zamknij
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
