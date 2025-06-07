import { Session, User } from "@supabase/supabase-js";
import { create } from "zustand";

interface UserState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  setUser: (user: User | null, session: Session | null) => void;
  clearUser: () => void;
}

export const useUserStore = create<UserState>((set) => ({
  user: null,
  session: null,
  isLoading: true,
  setUser: (user, session) =>
    set(() => ({
      user,
      session,
      isLoading: false,
    })),
  clearUser: () => set({ user: null, session: null, isLoading: false }),
}));
