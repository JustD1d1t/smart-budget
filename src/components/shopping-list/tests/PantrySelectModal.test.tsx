import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import PantrySelectModal from "../PantrySelectModal";

// POPRAW ŚCIEŻKĘ! Jeśli test w src/components/shopping-list/tests/, a supabase w src/lib/
vi.mock("../../../lib/supabaseClient", () => ({
  supabase: {
    from: () => ({
      select: vi.fn().mockResolvedValue({
        data: [
          { id: "1", name: "Spiżarnia 1" },
          { id: "2", name: "Spiżarnia 2" }
        ],
        error: null
      })
    })
  }
}));

describe("PantrySelectModal", () => {
  let onClose: ReturnType<typeof vi.fn>;
  let onSelect: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    onClose = vi.fn();
    onSelect = vi.fn();
  });

  it("pokazuje spinner ładowania i potem listę spiżarni", async () => {
    render(<PantrySelectModal isOpen={true} onClose={onClose} onSelect={onSelect} />);

    // Najpierw spinner
    expect(screen.getByText("Ładowanie...")).toBeInTheDocument();

    // Potem lista spiżarni
    expect(await screen.findByText("Spiżarnia 1")).toBeInTheDocument();
    expect(screen.getByText("Spiżarnia 2")).toBeInTheDocument();
  });

  it("wywołuje onSelect i onClose po kliknięciu", async () => {
    render(<PantrySelectModal isOpen={true} onClose={onClose} onSelect={onSelect} />);
    const button = await screen.findByRole("button", { name: "Spiżarnia 1" });
    fireEvent.click(button);

    expect(onSelect).toHaveBeenCalledWith("1");
    expect(onClose).toHaveBeenCalled();
  });

  it("nie renderuje nic gdy isOpen === false", () => {
    render(<PantrySelectModal isOpen={false} onClose={onClose} onSelect={onSelect} />);
    expect(screen.queryByText("Wybierz spiżarnię")).not.toBeInTheDocument();
  });
});
