import { useState } from "react";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";

interface Pantry {
    id: string;
    name: string;
    isOwner: boolean;
}

type Props = {
    pantry: Pantry;
    onOpen: (id: string) => void;
    onRemove?: (id: string) => void;
    onRename?: (id: string, newName: string) => void;
};

export default function PantryItem({ pantry, onOpen, onRemove, onRename }: Props) {
    const [isEditing, setIsEditing] = useState(false);
    const [name, setName] = useState(pantry.name);

    const handleSave = () => {
        if (onRename && name.trim()) {
            onRename(pantry.id, name.trim());
        }
        setIsEditing(false);
    };

    return (
        <div className="border rounded-xl p-3 sm:p-4 mb-2 shadow bg-white">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                {isEditing ? (
                    <>
                        <Input
                            value={name}
                            onChange={e => setName(e.target.value)}
                            className="mb-2"
                            autoFocus
                        />
                        <div className="flex gap-2 w-full sm:w-auto">
                            <Button onClick={handleSave}>Zapisz</Button>
                            <Button variant="outline" onClick={() => setIsEditing(false)}>
                                Anuluj
                            </Button>
                        </div>
                    </>
                ) : (
                    <>
                        <h2 className="text-base sm:text-lg font-semibold break-words">{pantry.name}</h2>
                        <div className="flex flex-row gap-2 w-full sm:w-auto">
                            <Button
                                variant="outline"
                                onClick={() => onOpen(pantry.id)}
                                className="w-full sm:w-auto"
                            >
                                Otwórz
                            </Button>
                            {pantry.isOwner && (
                                <>
                                    <Button
                                        onClick={() => {
                                            setName(pantry.name);
                                            setIsEditing(true);
                                        }}
                                        className="w-full sm:w-auto"
                                    >
                                        Edytuj
                                    </Button>
                                    <Button
                                        variant="danger"
                                        onClick={() => onRemove?.(pantry.id)}
                                        className="w-full sm:w-auto"
                                    >
                                        Usuń
                                    </Button>
                                </>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
