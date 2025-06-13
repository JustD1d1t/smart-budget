import { beforeEach, describe, expect, it, vi } from "vitest";
import { useExpensesStore } from "../expensesStore";

vi.mock("../userStore", () => ({
  useUserStore: {
    getState: vi.fn(() => ({
      user: { id: "user-1" },
    })),
  },
}));

const mockViewerSelectEq = vi.fn();
const mockExpenseSelectGteLte = vi.fn();
const mockInsert = vi.fn();
const mockUpdateEqEq = vi.fn();
const mockViewerDeleteEq = vi.fn();
const mockViewerInsert = vi.fn();
const mockDeleteEq = vi.fn();

vi.mock("../../lib/supabaseClient", () => ({
  supabase: {
    from: (table: string) => {
      if (table === "expense_viewers") {
        return {
          select: () => ({
            eq: mockViewerSelectEq,
          }),
          delete: () => ({
            eq: mockViewerDeleteEq,
          }),
          insert: mockViewerInsert,
        };
      }

      if (table === "expenses") {
        return {
          insert: mockInsert,
          select: () => ({
            gte: () => ({
              lte: mockExpenseSelectGteLte,
            }),
          }),
          update: () => ({
            eq: () => ({
              eq: mockUpdateEqEq,
            }),
          }),
          delete: () => ({
            eq: mockDeleteEq,
          }),
        };
      }

      return {};
    },
  },
}));

beforeEach(() => {
  useExpensesStore.setState({ expenses: [], loading: false });
  vi.clearAllMocks();
});

describe("expensesStore", () => {
  it("fetches and filters expenses (own + shared)", async () => {
    mockViewerSelectEq.mockResolvedValueOnce({
      data: [{ expense_id: "shared-1" }],
      error: null,
    });

    mockExpenseSelectGteLte.mockResolvedValueOnce({
      data: [
        { id: "own-1", user_id: "user-1", amount: 100 },
        { id: "shared-1", user_id: "other-user", amount: 200 },
        { id: "other", user_id: "nope", amount: 999 },
      ],
    });

    await useExpensesStore
      .getState()
      .fetchExpenses("user-1", "2024-01-01", "2024-12-31");

    const expenses = useExpensesStore.getState().expenses;
    expect(expenses).toHaveLength(2);
    expect(expenses.some((e) => e.id === "own-1")).toBe(true);
    expect(expenses.some((e) => e.id === "shared-1")).toBe(true);
  });

  it("adds an expense with viewers", async () => {
    mockInsert.mockReturnValueOnce({
      select: () => ({
        single: () =>
          Promise.resolve({
            data: {
              id: "exp-1",
              user_id: "user-1",
              amount: 50,
              store: "Lidl",
              date: "2024-01-01",
              category: "żywność",
            },
            error: null,
          }),
      }),
    });

    const result = await useExpensesStore.getState().addExpense(
      {
        user_id: "user-1",
        amount: 50,
        store: "Lidl",
        date: "2024-01-01",
        category: "żywność",
      },
      [{ id: "viewer-1", email: "a", role: "viewer" }]
    );

    expect(result.success).toBe(true);
    expect(mockViewerInsert).toHaveBeenCalled();
    expect(useExpensesStore.getState().expenses[0].id).toBe("exp-1");
  });

  it("updates an expense and viewer list", async () => {
    useExpensesStore.setState({
      expenses: [
        {
          id: "e-1",
          user_id: "user-1",
          amount: 10,
          store: "test",
          date: "2024-01-01",
          category: "inne",
        },
      ],
    });

    mockUpdateEqEq.mockResolvedValueOnce({ error: null });

    const result = await useExpensesStore.getState().updateExpense(
      "e-1",
      "user-1",
      {
        amount: 99,
        store: "test",
        date: "2024-01-01",
        category: "żywność",
      },
      [{ id: "viewer-2", email: "b", role: "viewer" }]
    );

    expect(result.success).toBe(true);
    const updated = useExpensesStore.getState().expenses.find((e) => e.id === "e-1");
    expect(updated?.amount).toBe(99);
  });

  it("deletes an expense if user is owner", async () => {
    useExpensesStore.setState({
      expenses: [
        {
          id: "e-1",
          user_id: "user-1",
          amount: 10,
          store: "test",
          date: "2024-01-01",
          category: "inne",
        },
      ],
    });

    mockDeleteEq.mockResolvedValueOnce({ error: null });

    await useExpensesStore.getState().deleteExpense("e-1", "user-1");

    expect(useExpensesStore.getState().expenses).toHaveLength(0);
    expect(mockDeleteEq).toHaveBeenCalledWith("id", "e-1");
  });

  it("does not delete if user is not owner", async () => {
    useExpensesStore.setState({
      expenses: [
        {
          id: "e-1",
          user_id: "other-user",
          amount: 10,
          store: "test",
          date: "2024-01-01",
          category: "inne",
        },
      ],
    });

    await useExpensesStore.getState().deleteExpense("e-1", "user-1");

    expect(useExpensesStore.getState().expenses).toHaveLength(1);
    expect(mockDeleteEq).not.toHaveBeenCalled();
  });
});
