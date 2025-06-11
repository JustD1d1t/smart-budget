import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Toast from "../../components/ui/Toast";
import { supabase } from "../../lib/supabaseClient";

interface Pantry {
    id: string;
    name: string;
    owner_id: string;
    isOwner: boolean;
    isEditing?: boolean;
}

export default function PantryListPage() {
    const [pantries, setPantries] = useState<Pantry[]>([]);
    const [loading, setLoading] = useState(true);
    const [newPantryName, setNewPantryName] = useState("");
    const [nameError, setNameError] = useState<string | null>(null);
    const [toast, setToast] = useState<{ message: string; type?: "error" | "success" } | null>(null);
    const navigate = useNavigate();

    const fetchPantries = async () => {
        setLoading(true);
        const { data: userData } = await supabase.auth.getUser();
        const userId = userData.user?.id;

        const { data, error } = await supabase.from("pantries").select("*");

        if (error) {
            setToast({ message: "Nie udało się pobrać spiżarni.", type: "error" });
        } else {
            const withOwnership = data.map((pantry) => ({
                ...pantry,
                isOwner: pantry.owner_id === userId,
            }));
            setPantries(withOwnership);
        }

        setLoading(false);
    };

    useEffect(() => {
        fetchPantries();
    }, []);

    const handleAddPantry = async () => {
        if (!newPantryName.trim()) {
            setNameError("Nazwa nie może być pusta.");
            return;
        }

        setNameError(null);
        const { data: userData, error: userError } = await supabase.auth.getUser();
        const userId = userData?.user?.id;

        if (!userId || userError) {
            setToast({ message: "Nie udało się pobrać użytkownika.", type: "error" });
            return;
        }

        const { data, error } = await supabase
            .from("pantries")
            .insert({ name: newPantryName.trim(), owner_id: userId })
            .select()
            .single();

        if (error || !data) {
            setToast({ message: "Błąd podczas dodawania spiżarni.", type: "error" });
            return;
        }

        setNewPantryName("");
        await fetchPantries();
        setToast({ message: "Spiżarnia dodana pomyślnie!", type: "success" });
    };

    const handleRemovePantry = async (id: string) => {
        const { error } = await supabase.from("pantries").delete().eq("id", id);
        if (!error) {
            setPantries((prev) => prev.filter((p) => p.id !== id));
            setToast({ message: "Usunięto spiżarnię", type: "success" });
        } else {
            setToast({ message: "Błąd przy usuwaniu spiżarni", type: "error" });
        }
    };

    const handleRenamePantry = async (id: string, newName: string) => {
        if (!newName.trim()) return;
        const { error } = await supabase.from("pantries").update({ name: newName }).eq("id", id);
        if (!error) {
            setToast({ message: "Zmieniono nazwę spiżarni", type: "success" });
        }
    };

    return (
        <div className="max-w-2xl mx-auto">
            <h1 className="text-xl font-bold mb-4">📦 Twoje spiżarnie</h1>

            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(null)}
                />
            )}

            <div className="flex flex-col gap-2 mb-4 sm:flex-row sm:items-start">
                <div className="flex-1">
                    <Input
                        value={newPantryName}
                        onChange={(e) => setNewPantryName(e.target.value)}
                        placeholder="Nazwa spiżarni"
                        error={nameError || undefined}
                    />
                </div>
                <Button onClick={handleAddPantry}>Dodaj spiżarnię</Button>
            </div>

            {loading ? (
                <p>Ładowanie...</p>
            ) : pantries.length === 0 ? (
                <p>Brak spiżarni.</p>
            ) : (
                <ul className="space-y-4">
                    {pantries.map((pantry, index) => (
                        <li key={pantry.id} className="border rounded p-4">
                            <div className="flex justify-between items-center mb-2">
                                {pantry.isEditing ? (
                                    <>
                                        <Input
                                            value={pantry.name}
                                            onChange={(e) => {
                                                const updated = [...pantries];
                                                updated[index].name = e.target.value;
                                                setPantries(updated);
                                            }}
                                        />
                                        <Button
                                            onClick={() => {
                                                handleRenamePantry(pantry.id, pantry.name);
                                                const updated = [...pantries];
                                                updated[index].isEditing = false;
                                                setPantries(updated);
                                            }}
                                        >
                                            Zapisz
                                        </Button>
                                    </>
                                ) : (
                                    <>
                                        <h2 className="text-lg font-semibold">{pantry.name}</h2>
                                        <div className="flex gap-2">
                                            <Button
                                                variant="outline"
                                                onClick={() => navigate(`/pantries/${pantry.id}`)}
                                            >
                                                Otwórz
                                            </Button>
                                            {pantry.isOwner && (
                                                <>
                                                    <Button
                                                        onClick={() => {
                                                            const updated = [...pantries];
                                                            updated[index].isEditing = true;
                                                            setPantries(updated);
                                                        }}
                                                    >
                                                        Zmień nazwę
                                                    </Button>
                                                    <Button variant="danger" onClick={() => handleRemovePantry(pantry.id)}>
                                                        Usuń
                                                    </Button>
                                                </>
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
