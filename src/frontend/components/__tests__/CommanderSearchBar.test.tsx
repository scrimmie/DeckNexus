import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { CommanderSearchBar } from "../CommanderSearchBar";

describe("CommanderSearchBar", () => {
  it("renders search input and button", () => {
    const mockOnSearch = vi.fn();

    render(<CommanderSearchBar onSearch={mockOnSearch} isLoading={false} />);

    expect(
      screen.getByPlaceholderText(/Enter commander name/)
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /search/i })).toBeInTheDocument();
  });

  it("calls onSearch when form is submitted", async () => {
    const mockOnSearch = vi.fn();

    render(<CommanderSearchBar onSearch={mockOnSearch} isLoading={false} />);

    const input = screen.getByPlaceholderText(/Enter commander name/);
    const searchButton = screen.getByRole("button", { name: /search/i });

    fireEvent.change(input, { target: { value: "Atraxa" } });
    fireEvent.click(searchButton);

    await waitFor(() => {
      expect(mockOnSearch).toHaveBeenCalledWith("Atraxa");
    });
  });

  it("shows loading state", () => {
    const mockOnSearch = vi.fn();

    render(<CommanderSearchBar onSearch={mockOnSearch} isLoading={true} />);

    expect(screen.getByText("Searching...")).toBeInTheDocument();
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("disables search when input is empty", () => {
    const mockOnSearch = vi.fn();

    render(<CommanderSearchBar onSearch={mockOnSearch} isLoading={false} />);

    const searchButton = screen.getByRole("button", { name: /search/i });
    expect(searchButton).toBeDisabled();
  });
});
