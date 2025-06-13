import { beforeEach, describe, expect, it, vi } from "vitest";
import { usePantriesStore } from "../pantriesStore";

// Poprawiony mock supabase!
vi.mock("../../lib/supabaseClient", () => ({
  supabase: {
    auth: { getUser: vi.fn() },
    from: vi.fn(),
  },
}));

import { supabase } from "../../lib/supabaseClient";

const mockUser = { id: "u1", email: "a@a.pl" };
const ownedPantries = [{ id: "p1", name: "Moja", owner_id: "u1" }];
const sharedPantries = [{ id: "p2", name: "Współ", owner_id: "u2" }];
const pantryItems = [
  { id: "i1", name: "chleb", category: "żywność", quantity: 1, unit: "szt" },
];
const pantryMembers = [{ id: "m1", email: "b@b.pl", role: "member" }];

describe("usePantriesStore", () => {
  beforeEach(() => {
    usePantriesStore.setState({
      pantries: [],
      pantryItems: [],
      pantryMembers: [],
      selectedPantry: null,
      isOwner: false,
      loading: false,
    });
    vi.clearAllMocks();
  });

  // fetchPantries
  it("fetchPantries pobiera owned i shared spiżarnie", async () => {
    supabase.auth.getUser.mockResolvedValue({ data: { user: mockUser } });

    supabase.from
      // pantry_members dla shared
      .mockImplementationOnce(() => ({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: [{ pantry_id: "p2" }] }),
        }),
      }))
      // owned pantries
      .mockImplementationOnce(() => ({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: ownedPantries }),
        }),
      }))
      // shared pantries (TU DODAĆ .in())
      .mockImplementationOnce(() => ({
        select: vi.fn().mockReturnValue({
          in: vi.fn().mockResolvedValue({ data: sharedPantries }),
        }),
      }));

    await usePantriesStore.getState().fetchPantries();
    const pans = usePantriesStore.getState().pantries;
    expect(pans).toHaveLength(2);
    expect(pans.find((p) => p.id === "p1")?.isOwner).toBe(true);
    expect(pans.find((p) => p.id === "p2")?.isOwner).toBe(false);
  });

  // fetchPantryDetails
  it("fetchPantryDetails pobiera szczegóły i ustawia ownera", async () => {
    supabase.auth.getUser.mockResolvedValue({ data: { user: mockUser } });
    supabase.from.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi
            .fn()
            .mockResolvedValue({
              data: { ...ownedPantries[0], owner_id: "u1" },
            }),
        }),
      }),
    });
    await usePantriesStore.getState().fetchPantryDetails("p1");
    expect(usePantriesStore.getState().selectedPantry?.id).toBe("p1");
    expect(usePantriesStore.getState().isOwner).toBe(true);
  });

  // fetchPantryItems
  it("fetchPantryItems pobiera produkty do pantryItems", async () => {
    supabase.from.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ data: pantryItems }),
      }),
    });
    await usePantriesStore.getState().fetchPantryItems("p1");
    expect(usePantriesStore.getState().pantryItems).toEqual(pantryItems);
  });

  // fetchPantryMembers
  it("fetchPantryMembers pobiera członków", async () => {
    supabase.from.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ data: pantryMembers }),
      }),
    });
    await usePantriesStore.getState().fetchPantryMembers("p1");
    expect(usePantriesStore.getState().pantryMembers).toEqual(pantryMembers);
  });

  // addPantry success
  it("addPantry dodaje spiżarnię (success)", async () => {
    supabase.auth.getUser.mockResolvedValue({ data: { user: mockUser } });

    // 1. INSERT nowej spiżarni
    supabase.from
      .mockImplementationOnce(() => ({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi
              .fn()
              .mockResolvedValue({
                data: { id: "p3", name: "Nowa", owner_id: "u1" },
                error: null,
              }),
          }),
        }),
      }))
      // 2. fetchPantries: pantry_members dla shared
      .mockImplementationOnce(() => ({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: [{ pantry_id: "p2" }] }),
        }),
      }))
      // 3. fetchPantries: owned pantries
      .mockImplementationOnce(() => ({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: ownedPantries }),
        }),
      }))
      // 4. fetchPantries: shared pantries (select().in())
      .mockImplementationOnce(() => ({
        select: vi.fn().mockReturnValue({
          in: vi.fn().mockResolvedValue({ data: sharedPantries }),
        }),
      }));

    const result = await usePantriesStore.getState().addPantry("Nowa");
    expect(result.success).toBe(true);
    expect(supabase.from).toHaveBeenCalledWith("pantries");
  });

  // addPantry brak usera
  it("addPantry - brak usera zwraca error", async () => {
    supabase.auth.getUser.mockResolvedValue({ data: { user: null } });
    const result = await usePantriesStore.getState().addPantry("Nowa");
    expect(result.success).toBe(false);
    expect(result.error).toBe("Brak użytkownika");
  });

  // removePantry
  it("removePantry usuwa spiżarnię po id", async () => {
    usePantriesStore.setState({
      pantries: [{ id: "p1", name: "N", owner_id: "u1" }],
    });
    supabase.from.mockReturnValue({
      delete: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      }),
    });
    await usePantriesStore.getState().removePantry("p1");
    expect(usePantriesStore.getState().pantries).toEqual([]);
  });

  // renamePantry
  it("renamePantry wywołuje update", async () => {
    supabase.from.mockReturnValue({
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({}),
      }),
    });
    await usePantriesStore.getState().renamePantry("p1", "Nowa nazwa");
    expect(supabase.from).toHaveBeenCalledWith("pantries");
  });

  // addPantryItem
  it("addPantryItem dodaje produkt do pantryItems", () => {
    usePantriesStore.setState({ pantryItems: [] });
    usePantriesStore.getState().addPantryItem(pantryItems[0]);
    expect(usePantriesStore.getState().pantryItems).toHaveLength(1);
  });

  // updatePantryItem
  it("updatePantryItem aktualizuje produkt", () => {
    usePantriesStore.setState({
      pantryItems: [{ ...pantryItems[0], name: "stary" }],
    });
    usePantriesStore
      .getState()
      .updatePantryItem({ ...pantryItems[0], name: "nowy" });
    expect(usePantriesStore.getState().pantryItems[0].name).toBe("nowy");
  });

  // deletePantryItem
  it("deletePantryItem usuwa produkt po id", async () => {
    usePantriesStore.setState({ pantryItems: pantryItems });
    supabase.from.mockReturnValue({
      delete: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      }),
    });
    await usePantriesStore.getState().deletePantryItem("i1");
    expect(usePantriesStore.getState().pantryItems).toEqual([]);
  });

  // updateItemQuantity
  it("updateItemQuantity zmienia ilość produktu", async () => {
    usePantriesStore.setState({
      pantryItems: [{ ...pantryItems[0], quantity: 1 }],
    });
    supabase.from.mockReturnValue({
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      }),
    });
    await usePantriesStore.getState().updateItemQuantity("i1", 99);
    expect(usePantriesStore.getState().pantryItems[0].quantity).toBe(99);
  });

  // inviteMember sukces
  it("inviteMember zaprasza usera (sukces)", async () => {
    supabase.from
      // users
      .mockImplementationOnce(() => ({
        select: vi.fn().mockReturnValue({
          eq: vi
            .fn()
            .mockResolvedValue({ data: [{ id: "u2", email: "x@x.pl" }] }),
        }),
      }))
      // pantry_members (czy już jest członkiem)
      .mockImplementationOnce(() => ({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ data: [] }),
          }),
        }),
      }))
      // insert
      .mockImplementationOnce(() => ({
        insert: vi.fn().mockResolvedValue({ error: null }),
      }))
      // fetchPantryMembers
      .mockImplementationOnce(() => ({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: [] }),
        }),
      }));

    const result = await usePantriesStore
      .getState()
      .inviteMember("p1", "x@x.pl");
    expect(result.success).toBe(true);
    expect(result.message).toMatch(/zaproszony/i);
  });

  // inviteMember - brak usera
  it("inviteMember zwraca error gdy brak usera", async () => {
    supabase.from.mockImplementationOnce(() => ({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ data: [] }),
      }),
    }));
    const result = await usePantriesStore
      .getState()
      .inviteMember("p1", "z@z.pl");
    expect(result.success).toBe(false);
    expect(result.message).toMatch(/nie znaleziono/i);
  });

  // inviteMember - już jest członkiem
  it("inviteMember - już jest członkiem", async () => {
    supabase.from
      .mockImplementationOnce(() => ({
        select: vi.fn().mockReturnValue({
          eq: vi
            .fn()
            .mockResolvedValue({ data: [{ id: "u2", email: "x@x.pl" }] }),
        }),
      }))
      .mockImplementationOnce(() => ({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ data: [{ id: "m1" }] }),
          }),
        }),
      }));

    const result = await usePantriesStore
      .getState()
      .inviteMember("p1", "x@x.pl");
    expect(result.success).toBe(false);
    expect(result.message).toMatch(/już należy/i);
  });

  // inviteMember - błąd insert
  it("inviteMember - błąd insert", async () => {
    supabase.from
      .mockImplementationOnce(() => ({
        select: vi.fn().mockReturnValue({
          eq: vi
            .fn()
            .mockResolvedValue({ data: [{ id: "u2", email: "x@x.pl" }] }),
        }),
      }))
      .mockImplementationOnce(() => ({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ data: [] }),
          }),
        }),
      }))
      .mockImplementationOnce(() => ({
        insert: vi.fn().mockResolvedValue({ error: "dupa" }),
      }));

    const result = await usePantriesStore
      .getState()
      .inviteMember("p1", "x@x.pl");
    expect(result.success).toBe(false);
    expect(result.message).toMatch(/błąd/i);
  });

  // removeMember
  it("removeMember usuwa członka", async () => {
    usePantriesStore.setState({ pantryMembers: pantryMembers });
    supabase.from.mockReturnValue({
      delete: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      }),
    });
    await usePantriesStore.getState().removeMember("m1");
    expect(usePantriesStore.getState().pantryMembers).toEqual([]);
  });
});
