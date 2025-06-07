import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import Input from "../components/ui/Input";
import Toast from "../components/ui/Toast";
import { supabase } from "../lib/supabaseClient";
import { useUserStore } from "../stores/userStore";

const Register = () => {
    const { user } = useUserStore();
    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [toast, setToast] = useState<{ message: string; type?: "error" | "success" } | null>(null);

    useEffect(() => {
        if (user) {
            navigate("/", { replace: true });
        }
    }, [user, navigate]);

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        const { error } = await supabase.auth.signUp({ email, password });

        if (error) {
            setToast({ message: error.message, type: "error" });
        } else {
            setToast({ message: "Rejestracja zakończona! Sprawdź e-mail.", type: "success" });
            setTimeout(() => navigate("/login"), 1500);
        }
    };

    return (
        <div className="max-w-md mx-auto mt-24">
            <Card>
                <h1 className="text-xl font-bold mb-4">Rejestracja</h1>
                <form onSubmit={handleRegister} className="space-y-4">
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
                    <Button type="submit" className="w-full">Zarejestruj się</Button>
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
};

export default Register;
