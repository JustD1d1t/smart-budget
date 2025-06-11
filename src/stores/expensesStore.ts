import { create } from "zustand";
import { supabase } from "../lib/supabaseClient";

export type Expense = {
  id: string;
  amount: number;
  store: string;
  date: string;
  category: string;
  user_id: string;
};

export type Member = {
  id: string;
  email: string;
  role: string;
};

interface ExpensesStore {
  expenses: Expense[];
  loading: boolean;
  fetchExpenses: (userId: string, startDate: string, endDate: string) => Promise<void>;
  addExpense: (
    data: Omit<Expense, "id">,
    sharedWith?: Member[]
  ) => Promise<{ success: boolean; error?: string }>;
  updateExpense: (
    id: string,
    userId: string,
    updatedData: Omit<Expense, "id" | "user_id">,
    sharedWith: Member[]
  ) => Promise<{ success: boolean; error?: string }>;
  deleteExpense: (id: string, userId: string) => Promise<void>;
  setExpenses: (expenses: Expense[]) => void;
}

export const useExpensesStore = create<ExpensesStore>((set, get) => ({
  expenses: [],
  loading: false,

  fetchExpenses: async (userId, startDate, endDate) => {
    set({ loading: true });

    const { data: viewerLinks } = await supabase
      .from("expense_viewers")
      .select("expense_id")
      .eq("user_id", userId);

    const sharedIds = viewerLinks?.map((e) => e.expense_id) || [];

    const { data } = await supabase
      .from("expenses")
      .select("*")
      .gte("date", startDate)
      .lte("date", endDate);

    const filtered = (data || []).filter(
      (exp) => exp.user_id === userId || sharedIds.includes(exp.id)
    );

    set({ expenses: filtered, loading: false });
  },

  addExpense: async (data, sharedWith = []) => {
    const { data: inserted, error } = await supabase
      .from("expenses")
      .insert(data)
      .select()
      .single();

    if (error || !inserted) {
      return { success: false, error: "Błąd przy dodawaniu" };
    }

    if (sharedWith.length > 0) {
      await supabase.from("expense_viewers").insert(
        sharedWith.map((m) => ({ expense_id: inserted.id, user_id: m.id }))
      );
    }

    set((state) => ({ expenses: [inserted, ...state.expenses] }));
    return { success: true };
  },

  updateExpense: async (id, userId, updatedData, sharedWith) => {
    const { error: updateError } = await supabase
      .from("expenses")
      .update(updatedData)
      .eq("id", id)
      .eq("user_id", userId);

    if (updateError) {
      return { success: false, error: "Błąd zapisu zmian." };
    }

    await supabase.from("expense_viewers").delete().eq("expense_id", id);

    if (sharedWith.length > 0) {
      await supabase.from("expense_viewers").insert(
        sharedWith.map((m) => ({ expense_id: id, user_id: m.id }))
      );
    }

    const updated = { id, user_id: userId, ...updatedData } as Expense;
    set((state) => ({
      expenses: state.expenses.map((e) => (e.id === id ? updated : e)),
    }));

    return { success: true };
  },

  deleteExpense: async (id, userId) => {
    const { expenses } = get();
    const toDelete = expenses.find((e) => e.id === id);
    if (toDelete?.user_id !== userId) return;

    const { error } = await supabase.from("expenses").delete().eq("id", id);
    if (!error) {
      set({ expenses: expenses.filter((e) => e.id !== id) });
    }
  },

  setExpenses: (expenses) => set({ expenses }),
}));
