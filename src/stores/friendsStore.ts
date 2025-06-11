import { create } from "zustand";
import { supabase } from "../lib/supabaseClient";

export type Friend = {
  id: string;
  requester_id: string;
  recipient_id: string;
  status: "pending" | "accepted";
  created_at: string;
  user_email: string; // dla wyświetlania
};

type FriendsStore = {
  friends: Friend[];
  fetchFriends: () => Promise<void>;
  sendInvite: (email: string) => Promise<void>;
  acceptInvite: (id: string) => Promise<void>;
  removeFriend: (id: string) => Promise<void>;
};

export const useFriendsStore = create<FriendsStore>((set, get) => ({
  friends: [],

  fetchFriends: async () => {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) return;

    const { data, error } = await supabase
      .from("friends")
      .select(
        `
      *,
      recipient:recipient_id ( email ),
      requester:requester_id ( email )
    `
      )
      .or(`requester_id.eq.${user.id},recipient_id.eq.${user.id}`);

    if (!error && data) {
      const enriched = data.map((row) => ({
        ...row,
        user_email:
          row.requester_id === user.id
            ? row.recipient?.email
            : row.requester?.email,
      }));
      set({ friends: enriched });
    }
  },

  sendInvite: async (email) => {
    const { data: userToInvite } = await supabase
      .from("users")
      .select("id")
      .eq("email", email)
      .single();

    if (!userToInvite) throw new Error("Nie znaleziono użytkownika");

    const user = (await supabase.auth.getUser()).data.user;

    await supabase.from("friends").insert({
      requester_id: user.id,
      recipient_id: userToInvite.id,
    });

    await get().fetchFriends();
  },

  acceptInvite: async (id) => {
    await supabase.from("friends").update({ status: "accepted" }).eq("id", id);
    await get().fetchFriends();
  },

  removeFriend: async (id) => {
    await supabase.from("friends").delete().eq("id", id);
    await get().fetchFriends();
  },
}));
