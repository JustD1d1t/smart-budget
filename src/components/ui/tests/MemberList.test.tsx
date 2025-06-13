import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useFriendsStore } from "../../../stores/friendsStore";
import MemberList from "../MemberList";

// Mock store
vi.mock("../../../stores/friendsStore", () => ({
  useFriendsStore: vi.fn(),
}));

// Mock Accordion
vi.mock("../Accordion", () => ({
  default: ({ children, title }: any) => (
    <div>
      <h2>{title}</h2>
      {children}
    </div>
  ),
}));

// Mock Button
vi.mock("../Button", () => ({
  default: ({ onClick, children }: any) => (
    <button onClick={onClick}>{children}</button>
  ),
}));

describe("MemberList", () => {
  const fetchFriendsMock = vi.fn();

  const defaultFriends = [
    { user_email: "friend1@example.com", status: "accepted" },
    { user_email: "member@example.com", status: "accepted" },
    { user_email: "pending@example.com", status: "pending" },
  ];

  beforeEach(() => {
    (useFriendsStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      friends: defaultFriends,
      fetchFriends: fetchFriendsMock,
    });
  });

  it("renders all members", () => {
    render(
      <MemberList
        members={[{ id: "1", email: "member@example.com", role: "editor" }]}
        isOwner={false}
        onInvite={vi.fn()}
        onRemove={vi.fn()}
      />
    );

    expect(screen.getByText("member@example.com")).toBeInTheDocument();
  });

  it("calls fetchFriends on mount", () => {
    render(
      <MemberList
        members={[]}
        isOwner={true}
        onInvite={vi.fn()}
        onRemove={vi.fn()}
      />
    );

    expect(fetchFriendsMock).toHaveBeenCalled();
  });

  it("shows invite section only for owners", () => {
    render(
      <MemberList
        members={[]}
        isOwner={true}
        onInvite={vi.fn()}
        onRemove={vi.fn()}
      />
    );

    expect(screen.getByText("Zaproś")).toBeInTheDocument();
  });

  it("does not show invite section for non-owners", () => {
    render(
      <MemberList
        members={[]}
        isOwner={false}
        onInvite={vi.fn()}
        onRemove={vi.fn()}
      />
    );

    expect(screen.queryByText("Zaproś")).not.toBeInTheDocument();
  });

  it("filters out already invited members from friend list", () => {
    render(
      <MemberList
        members={[{ id: "1", email: "member@example.com", role: "editor" }]}
        isOwner={true}
        onInvite={vi.fn()}
        onRemove={vi.fn()}
      />
    );

    expect(screen.getByRole("option", { name: "friend1@example.com" })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "member@example.com" })).not.toBeInTheDocument();
  });

  it("calls onInvite when a friend is selected and button clicked", () => {
    const onInviteMock = vi.fn();

    render(
      <MemberList
        members={[]}
        isOwner={true}
        onInvite={onInviteMock}
        onRemove={vi.fn()}
      />
    );

    fireEvent.change(screen.getByRole("combobox"), {
      target: { value: "friend1@example.com" },
    });

    fireEvent.click(screen.getByText("Zaproś"));

    expect(onInviteMock).toHaveBeenCalledWith("friend1@example.com");
  });

  it("clears selectedEmail after invite", async () => {
    render(
      <MemberList
        members={[]}
        isOwner={true}
        onInvite={() => { }}
        onRemove={() => { }}
      />
    );

    const select = screen.getByRole("combobox");

    fireEvent.change(select, { target: { value: "friend1@example.com" } });
    fireEvent.click(screen.getByText("Zaproś"));

    await waitFor(() => {
      expect((select as HTMLSelectElement).value).toBe("");
    });
  });

  it("calls onRemove when owner clicks remove on editor", () => {
    const onRemoveMock = vi.fn();

    render(
      <MemberList
        members={[
          { id: "1", email: "member@example.com", role: "editor" },
          { id: "2", email: "owner@example.com", role: "owner" },
        ]}
        isOwner={true}
        onInvite={vi.fn()}
        onRemove={onRemoveMock}
      />
    );

    fireEvent.click(screen.getByText("Usuń"));

    expect(onRemoveMock).toHaveBeenCalledWith("1");
  });

  it("does not show remove button for owner member", () => {
    render(
      <MemberList
        members={[{ id: "2", email: "owner@example.com", role: "owner" }]}
        isOwner={true}
        onInvite={vi.fn()}
        onRemove={vi.fn()}
      />
    );

    expect(screen.queryByText("Usuń")).not.toBeInTheDocument();
  });
});
