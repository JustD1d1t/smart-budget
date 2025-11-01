import { create } from "zustand";
import { supabase } from "../lib/supabaseClient";

/* ================== TYPES ================== */

export interface Pantry {
  id: string;
  name: string;
  owner_id: string;
  isOwner?: boolean;
}

export interface PantryItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  expiry_date?: string | null;
  ean?: string | null; // opcjonalnie, jeśli używasz EAN
}

export interface Member {
  id: string;
  email: string;
  role: string;
}

interface PantriesStore {
  pantries: Pantry[];
  pantryItems: PantryItem[];
  pantryMembers: Member[];
  selectedPantry: Pantry | null;
  isOwner: boolean;
  loading: boolean;

  fetchPantries: () => Promise<void>;
  fetchPantryDetails: (pantryId: string) => Promise<void>;
  fetchPantryItems: (pantryId: string) => Promise<void>;
  fetchPantryMembers: (pantryId: string) => Promise<void>;

  addPantry: (name: string) => Promise<{ success: boolean; error?: string }>;
  removePantry: (id: string) => Promise<void>;
  renamePantry: (id: string, newName: string) => Promise<void>;

  /** UP S E R T — klucz do braku duplikatów */
  upsertPantryItem: (item: PantryItem) => void;

  /** Legacy API – zostawiam, ale w środku używa upsert */
  addPantryItem: (item: PantryItem) => void;

  /** Zapis pełnego obiektu item do bazy + upsert do store */
  updatePantryItem: (item: PantryItem) => Promise<void>;

  /** Skasuj w bazie + usuń ze store */
  deletePantryItem: (id: string) => Promise<void>;

  /** Update tylko quantity (w bazie) + upsert do store */
  updateItemQuantity: (id: string, quantity: number) => Promise<void>;

  inviteMember: (
    pantryId: string,
    email: string
  ) => Promise<{ success: boolean; message: string }>;
  removeMember: (memberId: string) => Promise<void>;
}

/* ================== STORE ================== */

export const usePantriesStore = create<PantriesStore>((set, get) => ({
  pantries: [],
  pantryItems: [],
  pantryMembers: [],
  selectedPantry: null,
  isOwner: false,
  loading: false,

  /* -------- PANTRIES (LISTA / DANE) -------- */

  fetchPantries: async () => {
    set({ loading: true });

    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user?.id;
    if (!userId) {
      set({ loading: false });
      return;
    }

    const { data: viewerLinks } = await supabase
      .from("pantry_members")
      .select("pantry_id")
      .eq("user_id", userId);

    const sharedIds = viewerLinks?.map((v) => v.pantry_id) || [];

    const { data: ownedPantries } = await supabase
      .from("pantries")
      .select("*")
      .eq("owner_id", userId);

    const { data: sharedPantries } = sharedIds.length
      ? await supabase.from("pantries").select("*").in("id", sharedIds)
      : { data: [] as Pantry[] };

    const combined = [...(ownedPantries || []), ...(sharedPantries || [])];
    const withOwnership = combined.map((p) => ({
      ...p,
      isOwner: p.owner_id === userId,
    }));

    set({ pantries: withOwnership, loading: false });
  },

  fetchPantryDetails: async (id) => {
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user?.id || null;

    const { data } = await supabase
      .from("pantries")
      .select("*")
      .eq("id", id)
      .single();

    if (data) {
      set({
        selectedPantry: data,
        isOwner: userId ? data.owner_id === userId : false,
      });
    }
  },

  fetchPantryItems: async (id) => {
    set({ loading: true });
    const { data } = await supabase
      .from("pantry_items")
      .select("*")
      .eq("pantry_id", id);

    if (data) {
      set({ pantryItems: data as PantryItem[] });
    }
    set({ loading: false });
  },

  fetchPantryMembers: async (id) => {
    const { data } = await supabase
      .from("pantry_members")
      .select("id, email, role")
      .eq("pantry_id", id);

    if (data) {
      set({ pantryMembers: data as Member[] });
    }
  },

  addPantry: async (name) => {
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user?.id;

    if (!userId) return { success: false, error: "Brak użytkownika" };

    const { data, error } = await supabase
      .from("pantries")
      .insert({ name: name.trim(), owner_id: userId })
      .select()
      .single();

    if (error || !data) {
      return { success: false, error: "Błąd przy dodawaniu" };
    }

    await get().fetchPantries();
    return { success: true };
  },

  removePantry: async (id) => {
    const { error } = await supabase.from("pantries").delete().eq("id", id);
    if (!error) {
      set((state) => ({
        pantries: state.pantries.filter((p) => p.id !== id),
      }));
    }
  },

  renamePantry: async (id, newName) => {
    await supabase.from("pantries").update({ name: newName }).eq("id", id);
    // opcjonalnie: odśwież listę / lokalnie podmień nazwę
    set((state) => ({
      pantries: state.pantries.map((p) =>
        p.id === id ? { ...p, name: newName } : p
      ),
    }));
  },

  /* -------- ITEMS (UP S E R T / CRUD) -------- */

  /** Klucz do braku duplikatów — zawsze podmieniaj po id */
  upsertPantryItem: (item) =>
    set((state) => {
      const idx = state.pantryItems.findIndex((i) => i.id === item.id);
      if (idx === -1) {
        return { pantryItems: [...state.pantryItems, item] };
      }
      const next = state.pantryItems.slice();
      next[idx] = item;
      return { pantryItems: next };
    }),

  /** Legacy alias, żeby nic Ci się nie wywaliło w dotychczasowych wywołaniach */
  addPantryItem: (item) => {
    get().upsertPantryItem(item);
  },

  /** Pełny update rekordu (np. po edycji w modalu) – zapis w DB + upsert wyniku */
  updatePantryItem: async (item) => {
    const { id, ...rest } = item;
    const { data, error } = await supabase
      .from("pantry_items")
      .update(rest)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("updatePantryItem error:", error.message);
      return;
    }
    if (data) {
      get().upsertPantryItem(data as PantryItem);
    }
  },

  /** Usuwanie itemu (DB + local) */
  deletePantryItem: async (id) => {
    const { error } = await supabase.from("pantry_items").delete().eq("id", id);
    if (!error) {
      set((state) => ({
        pantryItems: state.pantryItems.filter((i) => i.id !== id),
      }));
    }
  },

  /** Update tylko ilości — zapis w DB i upsert zwróconego rekordu */
  updateItemQuantity: async (id, quantity) => {
    const { data, error } = await supabase
      .from("pantry_items")
      .update({ quantity })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("updateItemQuantity error:", error.message);
      return;
    }
    if (data) {
      get().upsertPantryItem(data as PantryItem);
    }
  },

  /* -------- MEMBERS -------- */

  inviteMember: async (pantryId, email) => {
    const { data: users } = await supabase
      .from("users")
      .select("id, email")
      .eq("email", email);

    if (!users || users.length === 0) {
      return { success: false, message: "Nie znaleziono użytkownika." };
    }
    const user = users[0];

    const { data: existing } = await supabase
      .from("pantry_members")
      .select("id")
      .eq("pantry_id", pantryId)
      .eq("user_id", user.id);

    if (existing && existing.length > 0) {
      return {
        success: false,
        message: "Użytkownik już należy do tej spiżarni.",
      };
    }

    const { error } = await supabase.from("pantry_members").insert({
      pantry_id: pantryId,
      user_id: user.id,
      email: user.email,
      role: "member",
    });

    if (error) {
      return { success: false, message: "Błąd przy zapraszaniu." };
    }

    await get().fetchPantryMembers(pantryId);
    return { success: true, message: "Użytkownik zaproszony!" };
  },

  removeMember: async (memberId) => {
    const { error } = await supabase
      .from("pantry_members")
      .delete()
      .eq("id", memberId);
    if (!error) {
      set((state) => ({
        pantryMembers: state.pantryMembers.filter((m) => m.id !== memberId),
      }));
    }
  },
}));
