import { beforeEach, describe, expect, it } from "vitest";
import { useUserStore } from "../userStore";

const fakeUser = { id: "u1", email: "a@b.pl" } as any;
const fakeSession = { access_token: "abc", user: fakeUser } as any;

describe("useUserStore", () => {
  beforeEach(() => {
    useUserStore.setState({
      user: null,
      session: null,
      isLoading: true,
    });
  });

  it("ustawia stan początkowy", () => {
    const state = useUserStore.getState();
    expect(state.user).toBeNull();
    expect(state.session).toBeNull();
    expect(state.isLoading).toBe(true);
  });

  it("setUser ustawia user, session i wyłącza loading", () => {
    useUserStore.getState().setUser(fakeUser, fakeSession);
    const state = useUserStore.getState();
    expect(state.user).toEqual(fakeUser);
    expect(state.session).toEqual(fakeSession);
    expect(state.isLoading).toBe(false);
  });

  it("clearUser zeruje user, session i isLoading", () => {
    useUserStore.setState({
      user: fakeUser,
      session: fakeSession,
      isLoading: false,
    });
    useUserStore.getState().clearUser();
    const state = useUserStore.getState();
    expect(state.user).toBeNull();
    expect(state.session).toBeNull();
    expect(state.isLoading).toBe(false);
  });
});
