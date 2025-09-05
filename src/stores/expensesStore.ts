import { create } from "zustand";
import { supabase } from "../lib/supabaseClient";

/* Typy */
export type Expense = {
  id: string;
  amount: number;
  store: string;
  date: string; // "YYYY-MM-DD"
  category: string | null; // może być null przy braku
  user_id: string;

  // nowe/ opcjonalne pola
  description?: string | null;
  receipt_path?: string | null;
  receipt_mime?: string | null;
  created_at?: string; // timestamptz z bazy
};

export type Member = {
  id: string;
  email: string;
  role?: string; // "viewer"|"editor" itp. (opcjonalne)
};

type AddExpenseResult = { success: boolean; data?: Expense; error?: string };
type UpdateExpenseResult = { success: boolean; data?: Expense; error?: string };

interface ExpensesStore {
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
  ) => Promise<AddExpenseResult>;

  updateExpense: (
    id: string,
    userId: string,
    updatedData: Omit<Expense, "id" | "user_id">,
    sharedWith: Member[]
  ) => Promise<UpdateExpenseResult>;

  deleteExpense: (id: string, userId: string) => Promise<void>;

  setExpenses: (expenses: Expense[]) => void;
}

/* Store */
export const useExpensesStore = create<ExpensesStore>((set, get) => ({
  expenses: [],
  loading: false,

  fetchExpenses: async (userId, startDate, endDate) => {
    set({ loading: true });
    try {
      // Idki wydatków, do których user ma dostęp jako viewer
      const { data: viewerLinks, error: viewersErr } = await supabase
        .from("expense_viewers")
        .select("expense_id")
        .eq("user_id", userId);

      if (viewersErr) {
        console.warn(
          "[fetchExpenses] expense_viewers error:",
          viewersErr.message
        );
      }

      const sharedIds = (viewerLinks?.map((e: any) => e.expense_id) ||
        []) as string[];

      // Pobierz wydatki z zakresu
      const { data, error } = await supabase
        .from("expenses")
        .select("*")
        .gte("date", startDate)
        .lte("date", endDate)
        .order("date", { ascending: false });

      if (error) {
        console.error("[fetchExpenses] expenses error:", error.message);
        set({ expenses: [], loading: false });
        return;
      }

      // Zostaw tylko te, które user posiada lub do których ma dostęp (viewer)
      const filtered = (data || []).filter(
        (exp: Expense) => exp.user_id === userId || sharedIds.includes(exp.id)
      );

      set({ expenses: filtered, loading: false });
    } catch (e) {
      console.error("[fetchExpenses] error:", e);
      set({ expenses: [], loading: false });
    }
  },

  addExpense: async (data, sharedWith = []) => {
    // KLUCZOWE: .select('*').single() -> dostajemy rekord z id
    const { data: inserted, error } = await supabase
      .from("expenses")
      .insert(data)
      .select("*")
      .single();

    if (error || !inserted) {
      console.error("[addExpense] insert error:", error?.message);
      return { success: false, error: "Błąd przy dodawaniu" };
    }

    // Zapisz współdzielących (jeśli są)
    if (sharedWith.length > 0) {
      const rows = sharedWith.map((m) => ({
        expense_id: inserted.id,
        user_id: m.id,
      }));
      const { error: linkErr } = await supabase
        .from("expense_viewers")
        .insert(rows);
      if (linkErr) {
        console.warn(
          "[addExpense] expense_viewers insert warning:",
          linkErr.message
        );
        // nie przerywaj – wydatek już istnieje
      }
    }

    // Dodaj do store na górę listy
    set((state) => ({ expenses: [inserted as Expense, ...state.expenses] }));
    return { success: true, data: inserted as Expense };
  },

  updateExpense: async (id, userId, updatedData, sharedWith) => {
    // Update tylko jeśli owner
    const { data: updated, error: updateError } = await supabase
      .from("expenses")
      .update(updatedData)
      .eq("id", id)
      .eq("user_id", userId)
      .select("*")
      .single();

    if (updateError) {
      console.error("[updateExpense] update error:", updateError.message);
      return { success: false, error: "Błąd zapisu zmian." };
    }

    // Zastąp listę viewerów dla danego wydatku
    const { error: delErr } = await supabase
      .from("expense_viewers")
      .delete()
      .eq("expense_id", id);

    if (delErr) {
      console.warn("[updateExpense] viewers delete warning:", delErr.message);
    }

    if (sharedWith.length > 0) {
      const rows = sharedWith.map((m) => ({
        expense_id: id,
        user_id: m.id,
      }));
      const { error: insErr } = await supabase
        .from("expense_viewers")
        .insert(rows);
      if (insErr) {
        console.warn("[updateExpense] viewers insert warning:", insErr.message);
      }
    }

    // Odśwież w store
    set((state) => ({
      expenses: state.expenses.map((e) =>
        e.id === id ? (updated as Expense) : e
      ),
    }));

    return { success: true, data: updated as Expense };
  },

  deleteExpense: async (id, userId) => {
    const { expenses } = get();
    const exp = expenses.find((e) => e.id === id);
    if (!exp || exp.user_id !== userId) return;

    try {
      // 0) Ustal ścieżkę paragonu (na wszelki wypadek dociągnij z DB)
      let receiptPath = exp.receipt_path ?? null;
      if (!receiptPath) {
        const { data: row } = await supabase
          .from("expenses")
          .select("receipt_path")
          .eq("id", id)
          .single();
        receiptPath = row?.receipt_path ?? null;
      }

      // 1) Usuń plik ze Storage (best-effort)
      if (receiptPath) {
        const { error: rmErr } = await supabase.storage
          .from("receipts")
          .remove([receiptPath]);
        if (rmErr)
          console.warn("[deleteExpense] storage remove warn:", rmErr.message);
      }

      // 2) Usuń powiązania viewerów (jeśli masz FK bez CASCADE)
      const { error: vwErr } = await supabase
        .from("expense_viewers")
        .delete()
        .eq("expense_id", id);
      if (vwErr)
        console.warn("[deleteExpense] viewers delete warn:", vwErr.message);

      // 3) Usuń sam wydatek (z dodatkowym sprawdzeniem właściciela)
      const { error } = await supabase
        .from("expenses")
        .delete()
        .eq("id", id)
        .eq("user_id", userId);
      if (error) {
        console.error("[deleteExpense] delete error:", error.message);
        return;
      }

      // 4) Aktualizacja store
      set({ expenses: expenses.filter((e) => e.id !== id) });
    } catch (e) {
      console.error("[deleteExpense] unexpected:", e);
    }
  },

  setExpenses: (expenses) => set({ expenses }),
}));
