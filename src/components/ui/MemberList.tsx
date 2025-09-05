import { useEffect, useState } from "react";
import { useFriendsStore } from "../../stores/friendsStore";
import Accordion from "./Accordion";
import Button from "./Button";

interface Member {
  id: string;
  email: string;
  role: string;
}

interface Props {
  members: Member[];
  isOwner: boolean;
  onInvite: (email: string) => void;
  onRemove: (id: string) => void;
}

const MemberList = ({ members, isOwner, onInvite, onRemove }: Props) => {
  const { friends, fetchFriends } = useFriendsStore();
  const [selectedEmail, setSelectedEmail] = useState("");

  useEffect(() => {
    fetchFriends();
  }, [fetchFriends]);

  const acceptedFriends = (friends || []).filter((f) => f.status === "accepted");

  // 🔸 Jeśli nie ma żadnych znajomych → nic nie pokazujemy (brak Accordionu)
  if (acceptedFriends.length === 0) {
    return null;
  }

  const availableEmails = acceptedFriends
    .map((f) => f.user_email)
    .filter((email) => !members.some((m) => m.email === email));

  return (
    <Accordion title="Współtwórcy">
      {isOwner && (
        <div className="mb-4 space-y-2">
          <select
            value={selectedEmail}
            onChange={(e) => setSelectedEmail(e.target.value)}
            className="w-full p-2 border rounded"
          >
            <option value="">-- wybierz znajomego --</option>
            {availableEmails.map((email) => (
              <option key={email} value={email}>
                {email}
              </option>
            ))}
          </select>
          <Button
            onClick={() => {
              if (selectedEmail) {
                onInvite(selectedEmail);
                setSelectedEmail("");
              }
            }}
          >
            Zaproś
          </Button>
        </div>
      )}

      <ul className="space-y-1 mt-4">
        {members.map((member) => (
          <li
            key={member.id}
            className="flex justify-between items-center border p-2 rounded"
          >
            <span data-testid={`member-email-${member.id}`}>{member.email}</span>

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
