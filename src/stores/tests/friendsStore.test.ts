import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useFriendsStore } from "../friendsStore";

// Mock supabase
vi.mock("../../lib/supabaseClient", () => {
  // Mockujemy metody
  return {
    supabase: {
      auth: {
        getUser: vi.fn(),
      },
      from: vi.fn(),
    },
  };
});

// Import po mocku!
import { supabase } from "../../lib/supabaseClient";

// Pomocniczy user
const mockUser = { id: "user1", email: "me@x.pl" };

describe("useFriendsStore", () => {
  beforeEach(() => {
    // Resetujemy store przed każdym testem
    useFriendsStore.setState({ friends: [] });
    vi.clearAllMocks();
  });

  afterEach(() => {
    useFriendsStore.setState({ friends: [] });
  });

  it("fetchFriends - ustawia friends dla bieżącego usera", async () => {
    // Mockujemy usera
    supabase.auth.getUser.mockResolvedValue({ data: { user: mockUser } });
    // Mockujemy odpowiedź z bazy friends
    const friendsData = [
      {
        id: "f1",
        requester_id: "user1",
        recipient_id: "user2",
        status: "pending",
        created_at: "2024-01-01",
        recipient: { email: "twoj@friend.pl" },
        requester: { email: "me@x.pl" },
      },
    ];
    const selectMock = vi
      .fn()
      .mockResolvedValue({ data: friendsData, error: null });
    supabase.from.mockReturnValue({
      select: vi.fn(() => ({ or: selectMock })),
    });

    await useFriendsStore.getState().fetchFriends();

    const friends = useFriendsStore.getState().friends;
    expect(friends).toHaveLength(1);
    expect(friends[0].user_email).toBe("twoj@friend.pl");
  });

  it("fetchFriends - nie ustawia friends gdy user null", async () => {
    supabase.auth.getUser.mockResolvedValue({ data: { user: null } });
    await useFriendsStore.getState().fetchFriends();
    expect(useFriendsStore.getState().friends).toEqual([]);
  });

  it("sendInvite - zaprasza nowego usera i odświeża listę", async () => {
    supabase.auth.getUser.mockResolvedValue({ data: { user: mockUser } });

    // 1. Mock znajdowania usera po emailu
    const userToInvite = { id: "user2" };
    const usersSelectMock = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({ data: userToInvite }),
      }),
    });
    supabase.from
      .mockImplementationOnce(() => ({ select: usersSelectMock })) // users
      // 2. Mock insert
      .mockImplementationOnce(() => ({ insert: vi.fn().mockResolvedValue({}) }))
      // 3. Mock fetchFriends (dla insertu i update)
      .mockImplementationOnce(() => ({
        select: vi.fn(() => ({
          or: vi.fn().mockResolvedValue({ data: [], error: null }),
        })),
      }));

    // Wywołujemy sendInvite
    await useFriendsStore.getState().sendInvite("invite@ktoś.pl");

    // Sprawdzamy czy fetchFriends został wywołany (friends zresetowane)
    expect(useFriendsStore.getState().friends).toEqual([]);
    // Sprawdzamy czy były wywołania
    expect(supabase.from).toHaveBeenCalledWith("users");
    expect(supabase.from).toHaveBeenCalledWith("friends");
  });

  it("sendInvite - wyrzuca błąd gdy usera nie znaleziono", async () => {
    supabase.auth.getUser.mockResolvedValue({ data: { user: mockUser } });
    // Brak usera
    const usersSelectMock = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({ data: null }),
      }),
    });
    supabase.from.mockImplementationOnce(() => ({ select: usersSelectMock }));

    await expect(
      useFriendsStore.getState().sendInvite("nieistnieje@ktoś.pl")
    ).rejects.toThrow("Nie znaleziono użytkownika");
  });

  it("acceptInvite - update'uje status i odświeża friends", async () => {
    // Mock update oraz fetchFriends
    supabase.from
      .mockImplementationOnce(() => ({
        update: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({}) }),
      }))
      .mockImplementationOnce(() => ({
        select: vi.fn(() => ({
          or: vi.fn().mockResolvedValue({ data: [], error: null }),
        })),
      }));

    await useFriendsStore.getState().acceptInvite("f1");

    expect(supabase.from).toHaveBeenCalledWith("friends");
    // Dwa razy (update i select)
    expect(supabase.from).toHaveBeenCalledTimes(2);
  });

  it("removeFriend - usuwa znajomego i odświeża friends", async () => {
    supabase.from
      .mockImplementationOnce(() => ({
        delete: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({}) }),
      }))
      .mockImplementationOnce(() => ({
        select: vi.fn(() => ({
          or: vi.fn().mockResolvedValue({ data: [], error: null }),
        })),
      }));

    await useFriendsStore.getState().removeFriend("f1");

    expect(supabase.from).toHaveBeenCalledWith("friends");
    expect(supabase.from).toHaveBeenCalledTimes(2);
  });
});
