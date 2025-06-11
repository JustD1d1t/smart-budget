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

type Member = {
  id: string;
  email: string;
};

type ExpensesStore = {
  expenses: Expense[];
  loading: boolean;
  fetchExpenses: (
    userId: string,
    startDate: string,
    endDate: string
  ) => Promise<void>;
  addExpense: (
    data: Omit<Expense, "id">,
    sharedWith?: Member[]
  ) => Promise<{ success: boolean; error?: string }>;
  deleteExpense: (id: string, userId: string) => Promise<void>;
  setExpenses: (expenses: Expense[]) => void;
  updateExpense: (
    id: string,
    userId: string,
    updatedData: {
      amount: number;
      store: string;
      date: string;
      category: string;
    },
    sharedWith: { id: string }[]
  ) => Promise<{ success: boolean; error?: string }>;
};

export const useExpensesStore = create<ExpensesStore>((set, get) => ({
  expenses: [],
  loading: false,

  fetchExpenses: async (userId, startDate, endDate) => {
    set({ loading: true });

    const { data: viewerLinks, error: viewersError } = await supabase
      .from("expense_viewers")
      .select("expense_id")
      .eq("user_id", userId);

    if (viewersError) {
      console.error("Błąd ładowania viewers:", viewersError.message);
      set({ expenses: [], loading: false });
      return;
    }

    const sharedIds = viewerLinks?.map((e) => e.expense_id) || [];

    const { data, error } = await supabase
      .from("expenses")
      .select("*")
      .gte("date", startDate)
      .lte("date", endDate);

    if (error) {
      console.error("Błąd ładowania wydatków:", error.message);
      set({ expenses: [], loading: false });
      return;
    }

    const filtered = (data || []).filter(
      (exp) => exp.user_id === userId || sharedIds.includes(exp.id)
    );

    set({ expenses: filtered, loading: false });
  },
  updateExpense: async (
    id: string,
    userId: string,
    updatedData: {
      amount: number;
      store: string;
      date: string;
      category: string;
    },
    sharedWith: { id: string }[]
  ): Promise<{ success: boolean; error?: string }> => {
    const { error: updateError } = await supabase
      .from("expenses")
      .update(updatedData)
      .eq("id", id)
      .eq("user_id", userId);

    if (updateError) {
      console.error("Błąd zapisu zmian:", updateError.message);
      return { success: false, error: "Błąd zapisu zmian." };
    }

    await supabase.from("expense_viewers").delete().eq("expense_id", id);

    if (sharedWith.length > 0) {
      const { error: viewerError } = await supabase
        .from("expense_viewers")
        .insert(
          sharedWith.map((m) => ({
            expense_id: id,
            user_id: m.id,
          }))
        );

      if (viewerError) {
        console.error("Błąd dodawania viewerów:", viewerError.message);
      }
    }

    return { success: true };
  },

  addExpense: async (expenseData, sharedWith = []) => {
    const { data: insertedExpense, error } = await supabase
      .from("expenses")
      .insert(expenseData)
      .select()
      .single();

    if (error || !insertedExpense) {
      console.error("Błąd dodawania wydatku:", error?.message);
      return { success: false, error: "Błąd dodawania wydatku." };
    }

    if (sharedWith.length > 0) {
      const { error: viewerError } = await supabase
        .from("expense_viewers")
        .insert(
          sharedWith.map((m) => ({
            expense_id: insertedExpense.id,
            user_id: m.id,
          }))
        );

      if (viewerError) {
        console.error("Błąd dodawania viewers:", viewerError.message);
      }
    }

    set((state) => ({
      expenses: [insertedExpense, ...state.expenses],
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
    } else {
      console.error("Błąd usuwania wydatku:", error.message);
    }
  },

  setExpenses: (expenses) => set({ expenses }),
}));
