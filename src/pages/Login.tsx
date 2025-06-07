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
