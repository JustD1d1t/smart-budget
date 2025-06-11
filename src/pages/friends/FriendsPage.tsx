// src/pages/FriendsPage.tsx
import { useEffect, useState } from "react";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Toast from "../../components/ui/Toast";
import { supabase } from "../../lib/supabaseClient";
import { useFriendsStore } from "../../stores/friendsStore";

export default function FriendsPage() {
    const { friends, fetchFriends, sendInvite, acceptInvite, removeFriend } =
        useFriendsStore();

    const [email, setEmail] = useState("");
    const [toast, setToast] = useState<{
        message: string;
        type: "info" | "success" | "error";
    } | null>(null);
    const [userId, setUserId] = useState<string | null>(null);

    useEffect(() => {
        supabase.auth.getUser().then(({ data }) => {
            setUserId(data.user?.id ?? null);
        });
        fetchFriends();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await sendInvite(email.trim());
            setEmail("");
            setToast({ message: "Zaproszenie wysłane!", type: "success" });
        } catch (err: any) {
            setToast({
                message: err.message || "Błąd przy wysyłaniu zaproszenia",
                type: "error",
            });
        }
    };

    const handleAccept = async (id: string) => {
        try {
            await acceptInvite(id);
            setToast({ message: "Zaproszenie zaakceptowane!", type: "success" });
        } catch {
            setToast({ message: "Błąd przy akceptowaniu", type: "error" });
        }
    };

    const handleRemove = async (id: string) => {
        try {
            await removeFriend(id);
            setToast({ message: "Znajomy usunięty", type: "info" });
        } catch {
            setToast({ message: "Błąd przy usuwaniu", type: "error" });
        }
    };

    const sent = friends.filter(f => f.requester_id === userId && f.status === "pending");
    const received = friends.filter(f => f.recipient_id === userId && f.status === "pending");
    const accepted = friends.filter(f => f.status === "accepted" && (f.requester_id === userId || f.recipient_id === userId));

    return (
        <div className="p-4 max-w-xl mx-auto space-y-6">
            <h1 className="text-2xl font-bold">Znajomi</h1>

            <form onSubmit={handleSubmit} className="flex gap-2">
                <Input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email znajomego"
                />
                <Button type="submit">Zaproś</Button>
            </form>

            <div className="space-y-4">
                {received.length > 0 && (
                    <div>
                        <h2 className="font-semibold text-lg">Otrzymane zaproszenia</h2>
                        <ul className="divide-y">
                            {received.map((f) => (
                                <li key={f.id} className="flex justify-between py-2 items-center">
                                    <div>
                                        <p>{f.user_email}</p>
                                        <p className="text-xs text-gray-500">{f.status}</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button size="sm" onClick={() => handleAccept(f.id)}>
                                            Akceptuj
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => handleRemove(f.id)}
                                        >
                                            Usuń
                                        </Button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {sent.length > 0 && (
                    <div>
                        <h2 className="font-semibold text-lg">Wysłane zaproszenia</h2>
                        <ul className="divide-y">
                            {sent.map((f) => (
                                <li key={f.id} className="flex justify-between py-2 items-center">
                                    <div>
                                        <p>{f.user_email}</p>
                                        <p className="text-xs text-gray-500">{f.status}</p>
                                    </div>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => handleRemove(f.id)}
                                    >
                                        Usuń
                                    </Button>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                <div>
                    <h2 className="font-semibold text-lg">Twoi znajomi</h2>
                    <ul className="divide-y">
                        {accepted.length === 0 && <li className="text-sm text-gray-500">Brak</li>}
                        {accepted.map((f) => (
                            <li key={f.id} className="flex justify-between py-2 items-center">
                                <div>
                                    <p>{f.user_email}</p>
                                </div>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleRemove(f.id)}
                                >
                                    Usuń
                                </Button>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    duration={5000}
                    onClose={() => setToast(null)}
                />
            )}
        </div>
    );
}
