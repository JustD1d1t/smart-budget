import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import Input from "../components/ui/Input";
import Toast from "../components/ui/Toast";
import { supabase } from "../lib/supabaseClient";
import { useUserStore } from "../stores/userStore";

export default function Login() {
    const { setUser } = useUserStore();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [toast, setToast] = useState<{ message: string; type?: "error" | "success" } | null>(null);

    const [showReset, setShowReset] = useState(false);
    const [resetEmail, setResetEmail] = useState("");
    const [resetLoading, setResetLoading] = useState(false);

    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();

        const { data, error } = await supabase.auth.signInWithPassword({ email, password });

        if (error) {
            setToast({ message: error.message, type: "error" });
        } else {
            setUser(data.user, data.session);
            navigate("/");
        }
    };

    const handlePasswordReset = async (e: React.FormEvent) => {
        e.preventDefault();
        setResetLoading(true);

        const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
            redirectTo: `${window.location.origin}/reset-password`, // ścieżka do formularza nowego hasła
        });

        if (error) {
            setToast({ message: error.message, type: "error" });
        } else {
            setToast({
                message: "Wysłano link do resetu hasła. Sprawdź maila!",
                type: "success",
            });
            setShowReset(false);
            setResetEmail("");
        }
        setResetLoading(false);
    };

    return (
        <div className="max-w-md mx-auto mt-24">
            <Card>
                <h1 className="text-xl font-bold mb-4">Logowanie</h1>
                <form onSubmit={handleLogin} className="space-y-4">
                    <Input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                    <Input
                        type="password"
                        placeholder="Hasło"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                    <Button type="submit" className="w-full">Zaloguj się</Button>
                </form>
                <div className="mt-4 text-center">
                    <button
                        type="button"
                        className="text-blue-600 text-sm hover:underline"
                        onClick={() => setShowReset(!showReset)}
                    >
                        Nie pamiętasz hasła?
                    </button>
                </div>
                {showReset && (
                    <form onSubmit={handlePasswordReset} className="mt-4 space-y-2 animate-fade-in">
                        <Input
                            type="email"
                            placeholder="Twój email"
                            value={resetEmail}
                            onChange={(e) => setResetEmail(e.target.value)}
                            required
                        />
                        <Button type="submit" className="w-full" disabled={resetLoading}>
                            {resetLoading ? "Wysyłanie..." : "Wyślij link resetujący"}
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            className="w-full"
                            onClick={() => setShowReset(false)}
                        >
                            Anuluj
                        </Button>
                    </form>
                )}
            </Card>
            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(null)}
                />
            )}
        </div>
    );
}
