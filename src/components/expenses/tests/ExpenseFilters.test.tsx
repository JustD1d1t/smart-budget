import { fireEvent, render, screen } from "@testing-library/react";
import { vi } from "vitest";
import ExpenseFilters from "../ExpenseFilters";

describe("ExpenseFilters", () => {
  const defaultProps = {
    filterCategory: "",
    onFilterCategoryChange: vi.fn(),
    sortOption: "",
    onSortOptionChange: vi.fn(),
    startDate: "",
    endDate: "",
    onStartDateChange: vi.fn(),
    onEndDateChange: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders all filter inputs", () => {
    const { container } = render(<ExpenseFilters {...defaultProps} />);

    // 2 selecty
    expect(screen.getAllByRole("combobox").length).toBe(2);

    // 2 inputy type="date"
    const dateInputs = container.querySelectorAll('input[type="date"]');
    expect(dateInputs.length).toBe(2);
  });

  it("calls onFilterCategoryChange when category changes", () => {
    render(<ExpenseFilters {...defaultProps} />);
    const selects = screen.getAllByRole("combobox");
    const categorySelect = selects[0];

    fireEvent.change(categorySelect, { target: { value: "chemia" } });
    expect(defaultProps.onFilterCategoryChange).toHaveBeenCalledWith("chemia");
  });

  it("calls onSortOptionChange with correct value when sort changes", () => {
    render(<ExpenseFilters {...defaultProps} />);
    const selects = screen.getAllByRole("combobox");
    const sortSelect = selects[1];

    fireEvent.change(sortSelect, { target: { value: "Data (najnowsze)" } });
    expect(defaultProps.onSortOptionChange).toHaveBeenCalledWith("date_desc");
  });

  it("calls onStartDateChange when start date changes", () => {
    const { container } = render(<ExpenseFilters {...defaultProps} />);
    const dateInputs = container.querySelectorAll('input[type="date"]');
    const startDateInput = dateInputs[0];

    fireEvent.change(startDateInput, { target: { value: "2023-01-01" } });
    expect(defaultProps.onStartDateChange).toHaveBeenCalledWith("2023-01-01");
  });

  it("calls onEndDateChange when end date changes", () => {
    const { container } = render(<ExpenseFilters {...defaultProps} />);
    const dateInputs = container.querySelectorAll('input[type="date"]');
    const endDateInput = dateInputs[1];

    fireEvent.change(endDateInput, { target: { value: "2023-12-31" } });
    expect(defaultProps.onEndDateChange).toHaveBeenCalledWith("2023-12-31");
  });
});
