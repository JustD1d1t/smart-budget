import { v4 as uuidv4 } from "uuid";
import { create } from "zustand";
import { supabase } from "../lib/supabaseClient";
import { useUserStore } from "./userStore";

export interface ShoppingList {
  id: string;
  name: string;
  user_id: string;
  created_at?: string;
}

interface ShoppingListState {
  lists: ShoppingList[];
  fetchLists: () => Promise<void>;
  addList: (name: string) => Promise<void>;
  removeList: (id: string) => Promise<void>;
}

export const useShoppingListStore = create<ShoppingListState>((set) => ({
  lists: [],

  fetchLists: async () => {
    const userId = useUserStore.getState().user?.id;
    if (!userId) return;

    const { data, error } = await supabase
      .from("shopping_lists")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (!error && data) {
      set({ lists: data });
    }
  },

  addList: async (name: string) => {
    const userId = useUserStore.getState().user?.id;
    if (!userId) return;

    const { data, error } = await supabase
      .from("shopping_lists")
      .insert({ id: uuidv4(), name, user_id: userId })
      .select();

    if (!error && data) {
      set((state) => ({ lists: [data[0], ...state.lists] }));
    }
  },

  removeList: async (id: string) => {
    const { error } = await supabase
      .from("shopping_lists")
      .delete()
      .eq("id", id);

    if (!error) {
      set((state) => ({
        lists: state.lists.filter((list) => list.id !== id),
      }));
    }
  },
}));
