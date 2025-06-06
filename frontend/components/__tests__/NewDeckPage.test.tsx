import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { NewDeckPage } from "../NewDeckPage";

// Mock the commander search hook
vi.mock("@/hooks/useCommanderSearch", () => ({
  useCommanderSearch: () => ({
    searchResults: [],
    isLoading: false,
    error: null,
    selectedCard: null,
    searchCommanders: vi.fn(),
    selectCommander: vi.fn(),
    clearSelection: vi.fn(),
    clearResults: vi.fn(),
  }),
}));

describe("NewDeckPage", () => {
  it("renders the page with search interface", () => {
    render(<NewDeckPage />);

    // Check for main heading
    expect(screen.getByText("Create New Deck")).toBeInTheDocument();

    // Check for search description
    expect(
      screen.getByText(/Start by searching for your commander/)
    ).toBeInTheDocument();

    // Check for commander search section
    expect(screen.getByText("Search for Your Commander")).toBeInTheDocument();

    // Check for search input
    expect(
      screen.getByPlaceholderText(/Enter commander name/)
    ).toBeInTheDocument();

    // Check for search button
    expect(screen.getByRole("button", { name: /search/i })).toBeInTheDocument();

    // Check for info message
    expect(
      screen.getByText(/Search for legendary creatures and planeswalkers/)
    ).toBeInTheDocument();

    // Check for ready state
    expect(screen.getByText("Ready to Search")).toBeInTheDocument();
  });
});
