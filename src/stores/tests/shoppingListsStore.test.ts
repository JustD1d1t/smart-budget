import { beforeEach, describe, expect, it, vi } from "vitest";
import { useShoppingListStore } from "../shoppingListStore";

// 🔁 Mock userStore
vi.mock("../userStore", () => ({
  useUserStore: {
    getState: vi.fn(() => ({
      user: { id: "user-123" },
    })),
  },
}));

// Supabase mocks
const mockOrder = vi.fn(); // ← kończy chain: .order(...)
const mockEq = vi.fn(() => ({ order: mockOrder })); // ← .eq().order()
const mockSelect = vi.fn(() => ({ eq: mockEq })); // ← .select().eq()

const mockInsertSelect = vi.fn(); // ← .insert().select()
const mockInsert = vi.fn(() => ({ select: mockInsertSelect }));

const mockDeleteEq = vi.fn(); // ← .delete().eq()
const mockDelete = vi.fn(() => ({ eq: mockDeleteEq }));

vi.mock("../../lib/supabaseClient", () => ({
  supabase: {
    from: () => ({
      select: mockSelect,
      insert: mockInsert,
      delete: mockDelete,
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
    }),
  },
}));

beforeEach(() => {
  useShoppingListStore.setState({ lists: [] });
  vi.clearAllMocks();
});

describe("shoppingListStore", () => {
  it("fetches shopping lists", async () => {
    mockOrder.mockResolvedValueOnce({
      data: [
        { id: "1", name: "Lista 1", user_id: "user-123" },
        { id: "2", name: "Lista 2", user_id: "user-123" },
      ],
      error: null,
    });

    await useShoppingListStore.getState().fetchLists();

    const lists = useShoppingListStore.getState().lists;
    expect(lists).toHaveLength(2);
    expect(lists[0].name).toBe("Lista 1");
  });

  it("adds a shopping list", async () => {
    mockInsertSelect.mockResolvedValueOnce({
      data: [{ id: "3", name: "Nowa lista", user_id: "user-123" }],
      error: null,
    });

    await useShoppingListStore.getState().addList("Nowa lista");

    const lists = useShoppingListStore.getState().lists;
    expect(lists).toHaveLength(1);
    expect(lists[0].name).toBe("Nowa lista");
  });

  it("removes a shopping list", async () => {
    useShoppingListStore.setState({
      lists: [
        { id: "1", name: "Lista 1", user_id: "user-123" },
        { id: "2", name: "Lista 2", user_id: "user-123" },
      ],
    });

    mockDeleteEq.mockResolvedValueOnce({ error: null });

    await useShoppingListStore.getState().removeList("1");

    const lists = useShoppingListStore.getState().lists;
    expect(lists).toHaveLength(1);
    expect(lists[0].id).toBe("2");
    expect(mockDeleteEq).toHaveBeenCalledWith("id", "1");
  });
});
