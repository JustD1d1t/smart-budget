import { Link, useLocation } from "react-router-dom";

type Expense = { id: string; amount: number; date: string; category: string; note?: string | null };

function formatPLN(v: number) {
    return new Intl.NumberFormat("pl-PL", { style: "currency", currency: "PLN" }).format(v || 0);
}

export default function ExpensesSummaryInline({ expenses }: { expenses: Expense[] }) {
    const total = (expenses ?? []).reduce((acc, e) => acc + (Number(e.amount) || 0), 0);

    const location = useLocation();
    const detailsHref = `${location.pathname}?details=1`; // bez nowej strony – otworzysz panel po query

    return (
        <div className="mt-4 flex items-center justify-between rounded-xl border p-4">
            <div className="text-sm">
                <div className="font-medium">Suma wydatków w tym widoku</div>
                <div className="text-xl font-semibold">{formatPLN(total)}</div>
            </div>

            <Link
                to={detailsHref}
                aria-label="Przejdź do szczegółów wydatków"
                className="inline-flex items-center rounded-full p-2 hover:bg-black/5"
            >
                {/* Ikona → możesz podmienić na lucide-react ArrowRightCircle */}
                <svg width="28" height="28" viewBox="0 0 24 24" aria-hidden>
                    <path d="M12 4l1.41 1.41L8.83 10H20v2H8.83l4.58 4.59L12 18l-8-8 8-8z" />
                </svg>
            </Link>
        </div>
    );
}
