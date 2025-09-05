import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Button from "../../components/ui/Button";
import Toast from "../../components/ui/Toast";
import { supabase } from "../../lib/supabaseClient";
import { useExpensesStore } from "../../stores/expensesStore";
import { useUserStore } from "../../stores/userStore";

type ExistingReceiptState = {
    path: string;
    url: string;
    name: string;
    mime?: string | null;
};

type Viewer = { id: string; email: string };

function formatPLN(v: number) {
    return new Intl.NumberFormat("pl-PL", { style: "currency", currency: "PLN" }).format(v || 0);
}

export default function ExpensePreviewPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useUserStore();
    const { expenses } = useExpensesStore();

    const [amount, setAmount] = useState<number | null>(null);
    const [store, setStore] = useState("");
    const [date, setDate] = useState("");
    const [category, setCategory] = useState("");
    const [description, setDescription] = useState<string | null>(null);

    const [viewers, setViewers] = useState<Viewer[]>([]);
    const [toast, setToast] = useState<{ message: string; type?: "error" | "success" } | null>(null);

    // zapisany paragon, jeżeli istnieje
    const [existingReceipt, setExistingReceipt] = useState<ExistingReceiptState | null>(null);
    const [loadingReceipt, setLoadingReceipt] = useState(false);

    // lightbox
    const [lightbox, setLightbox] = useState<{ src: string; alt: string } | null>(null);
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => e.key === "Escape" && setLightbox(null);
        if (lightbox) document.addEventListener("keydown", onKey);
        return () => document.removeEventListener("keydown", onKey);
    }, [lightbox]);

    // 1) Pobierz dane wydatku z istniejącego store; fallback: zostaw puste (strona zakłada wejście z listy)
    useEffect(() => {
        if (!id) return;
        const { user: u } = { user };
        const found = expenses.find((e) => e.id === id && e.user_id === u?.id);
        if (!found) {
            // Jeśli chcesz fallback do pojedynczego fetchu z supabase, odkomentuj:
            // (async () => {
            //   const { data } = await supabase.from("expenses").select("*").eq("id", id).maybeSingle();
            //   if (data && (!u || data.user_id === u.id)) {
            //     setAmount(data.amount);
            //     setStore(data.store);
            //     setDate(data.date);
            //     setCategory(data.category || "");
            //     setDescription((data as any).description ?? null);
            //   }
            // })();
            return;
        }
        setAmount(found.amount);
        setStore(found.store);
        setDate(found.date);
        setCategory(found.category || "");
        setDescription((found as any).description ?? null);
    }, [id, expenses, user?.id]);

    // 2) Współtwórcy (read-only)
    useEffect(() => {
        if (!id) return;
        (async () => {
            const { data: links } = await supabase
                .from("expense_viewers")
                .select("user_id")
                .eq("expense_id", id);

            const viewerIds = links?.map((v) => v.user_id) || [];
            if (viewerIds.length === 0) {
                setViewers([]);
                return;
            }

            const { data: profiles } = await supabase
                .from("profiles")
                .select("id, email")
                .in("id", viewerIds);

            setViewers((profiles || []).map((p) => ({ id: p.id, email: p.email })));
        })();
    }, [id]);

    // 3) Zapisany paragon (podpisany URL)
    useEffect(() => {
        const loadReceipt = async () => {
            if (!id || !user?.id) return;
            setLoadingReceipt(true);
            try {
                const folder = `${user.id}/${id}`;
                const { data: list, error } = await supabase.storage
                    .from("receipts")
                    .list(folder, { limit: 1000 });
                if (error) {
                    console.warn("[STORAGE] list error:", error);
                    setExistingReceipt(null);
                    return;
                }
                if (!list || list.length === 0) {
                    setExistingReceipt(null);
                    return;
                }

                // najnowszy po created_at/name
                const sorted = [...list].sort((a: any, b: any) => {
                    const da = a.created_at ? new Date(a.created_at).getTime() : 0;
                    const db = b.created_at ? new Date(b.created_at).getTime() : 0;
                    if (db !== da) return db - da;
                    return String(b.name).localeCompare(String(a.name));
                });

                const first = sorted[0];
                const fullPath = `${folder}/${first.name}`;
                const { data: signed, error: sErr } = await supabase.storage
                    .from("receipts")
                    .createSignedUrl(fullPath, 60 * 5);
                if (sErr) {
                    console.warn("[STORAGE] signed url error:", sErr);
                    setExistingReceipt(null);
                    return;
                }

                setExistingReceipt({
                    path: fullPath,
                    url: signed!.signedUrl,
                    name: first.name,
                    mime: (first as any)?.metadata?.mimetype ?? null,
                });
            } finally {
                setLoadingReceipt(false);
            }
        };
        loadReceipt();
    }, [id, user?.id]);

    const hasAllFields = useMemo(
        () => amount !== null && !!store && !!date && !!category,
        [amount, store, date, category]
    );

    return (
        <div className="max-w-xl mx-auto space-y-4">
            <h1 className="text-2xl font-bold">👀 Podgląd wydatku</h1>

            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            {/* Dane podstawowe */}
            <section className="rounded-xl border p-4 space-y-2">
                {!hasAllFields ? (
                    <div className="text-sm text-gray-500">Ładowanie danych…</div>
                ) : (
                    <>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                            <div className="text-gray-500">Kwota</div>
                            <div className="font-medium">{formatPLN(amount || 0)}</div>

                            <div className="text-gray-500">Sklep</div>
                            <div className="font-medium break-words">{store}</div>

                            <div className="text-gray-500">Data</div>
                            <div className="font-medium">{date}</div>

                            <div className="text-gray-500">Kategoria</div>
                            <div className="font-medium">
                                {category || <span className="text-gray-400">—</span>}
                            </div>
                        </div>

                        <div className="mt-3">
                            <div className="text-gray-500 text-sm mb-1">Opis</div>
                            <div className="whitespace-pre-wrap text-sm">
                                {description ? description : <span className="text-gray-400">Brak opisu</span>}
                            </div>
                        </div>
                    </>
                )}
            </section>

            {/* Współtwórcy (read-only lista adresów) */}
            <section className="rounded-xl border p-4">
                <div className="text-sm font-medium mb-2">Współtwórcy</div>
                {viewers.length === 0 ? (
                    <div className="text-sm text-gray-500">Brak współtwórców.</div>
                ) : (
                    <ul className="text-sm list-disc pl-5 space-y-1">
                        {viewers.map((v) => (
                            <li key={v.id}>{v.email}</li>
                        ))}
                    </ul>
                )}
            </section>

            {/* Paragon – tylko podgląd */}
            <section className="rounded-xl border p-4">
                <div className="text-sm font-medium mb-2">Paragon</div>
                {loadingReceipt ? (
                    <div className="text-sm text-gray-500">Ładowanie paragonu…</div>
                ) : !existingReceipt ? (
                    <div className="text-sm text-gray-500">Brak zapisanego paragonu.</div>
                ) : (
                    <div className="relative w-full max-w-xs">
                        <img
                            src={existingReceipt.url}
                            alt={existingReceipt.name || "Paragon"}
                            className="h-28 w-full object-cover rounded-md border cursor-zoom-in"
                            onClick={() =>
                                setLightbox({ src: existingReceipt.url, alt: existingReceipt.name || "Paragon" })
                            }
                            onError={(e) => {
                                (e.currentTarget as HTMLImageElement).style.visibility = "hidden";
                            }}
                        />
                        <div className="mt-1 text-xs text-gray-600 truncate">{existingReceipt.name}</div>
                    </div>
                )}
            </section>

            <div className="flex gap-2">
                <Button onClick={() => navigate(-1)} variant="ghost">
                    ← Wróć
                </Button>
                {id && (
                    <Button onClick={() => navigate(`/expenses/edit/${id}`)}>
                        ✏️ Edytuj
                    </Button>
                )}
            </div>

            {/* LIGHTBOX (max 70% wysokości + przycisk zamknięcia) */}
            {lightbox && (
                <div
                    className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
                    role="dialog"
                    aria-modal="true"
                    onClick={() => setLightbox(null)}
                >
                    <div
                        className="relative w-full"
                        style={{ maxWidth: `640px` }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="max-h-[70vh] overflow-auto rounded-lg shadow-xl bg-white/0">
                            <img
                                src={lightbox.src}
                                alt={lightbox.alt}
                                className="w-full h-auto object-contain"
                                style={{ maxHeight: "70vh" }}
                            />
                        </div>

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
