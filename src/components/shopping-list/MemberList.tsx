import Accordion from "../ui/Accordion";
import Button from "../ui/Button";

interface Member {
    id: string;
    email: string;
    role: string;
}

interface Props {
    members: Member[];
    isOwner: boolean;
    inviteEmail: string;
    emailError?: string;
    onEmailChange: (val: string) => void;
    onInvite: () => void;
    onRemove: (id: string) => void;
}

const MemberList = ({
    members,
    isOwner,
    inviteEmail,
    emailError,
    onEmailChange,
    onInvite,
    onRemove,
}: Props) => {
    return (
        <Accordion title="Współtwórcy">
            {isOwner && (
                <div className="mb-4">
                    <input
                        placeholder="Email osoby do zaproszenia"
                        value={inviteEmail}
                        onChange={(e) => onEmailChange(e.target.value)}
                        className="w-full p-2 border rounded"
                    />
                    {emailError && <p className="text-sm text-red-500 mt-1">{emailError}</p>}
                    <Button onClick={onInvite} className="mt-2">Zaproś</Button>
                </div>
            )}
            <ul className="space-y-1 mt-4">
                {members.map((member) => (
                    <li key={member.id} className="flex justify-between items-center border p-2 rounded">
                        <span>{member.email}</span>
                        {isOwner && member.role !== "owner" && (
                            <Button variant="danger" onClick={() => onRemove(member.id)}>
                                Usuń
                            </Button>
                        )}
                    </li>
                ))}
            </ul>
        </Accordion>
    );
};

export default MemberList;
