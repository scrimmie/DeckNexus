import { renderHook, waitFor, act } from "@testing-library/react";
import { beforeEach, describe, it, expect, vi } from "vitest";
import { useCommanderSearch } from "../useCommanderSearch";
import type { Card } from "../../types/scryfall";

// Mock the DeckNexus API
vi.mock("@/services/api", () => ({
  deckNexusApi: {
    searchCommanders: vi.fn(),
    searchCards: vi.fn(),
    getCardById: vi.fn(),
    getRandomCard: vi.fn(),
    healthCheck: vi.fn(),
  },
}));

// Import after mocking
import { deckNexusApi } from "@/services/api";

const mockSearchCommanders = vi.mocked(deckNexusApi.searchCommanders);

describe("useCommanderSearch", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return empty state initially", () => {
    const { result } = renderHook(() => useCommanderSearch());

    expect(result.current.searchResults).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.selectedCard).toBeNull();
  });

  it("should search commanders when searchCommanders is called", async () => {
    const mockCards: Card[] = [
      {
        id: "test-id",
        object: "card",
        name: "Atraxa, Praetors' Voice",
        lang: "en",
        released_at: "2023-01-01",
        uri: "https://api.scryfall.com/cards/test-id",
        scryfall_uri: "https://scryfall.com/card/test/1/atraxa",
        layout: "normal",
        type_line: "Legendary Creature — Phyrexian Angel Horror",
        legalities: { commander: "legal" },
        set: "test",
        set_name: "Test Set",
        set_type: "core",
        collector_number: "1",
        digital: false,
        rarity: "rare",
        border_color: "black",
        frame: "2015",
        full_art: false,
        textless: false,
        games: ["paper"],
        reserved: false,
        foil: false,
        nonfoil: true,
        oversized: false,
        promo: false,
        reprint: false,
      },
    ];

    mockSearchCommanders.mockResolvedValue(mockCards);

    const { result } = renderHook(() => useCommanderSearch());

    await act(async () => {
      await result.current.searchCommanders("Atraxa");
    });

    await waitFor(() => {
      expect(result.current.searchResults).toEqual(mockCards);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    expect(mockSearchCommanders).toHaveBeenCalledWith("Atraxa");
  });

  it("should handle search errors gracefully", async () => {
    mockSearchCommanders.mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(() => useCommanderSearch());

    await act(async () => {
      await result.current.searchCommanders("test");
    });

    await waitFor(() => {
      expect(result.current.error).toBe("Network error");
      expect(result.current.searchResults).toEqual([]);
      expect(result.current.isLoading).toBe(false);
    });
  });

  it("should show error message when no results found", async () => {
    mockSearchCommanders.mockResolvedValue([]);

    const { result } = renderHook(() => useCommanderSearch());

    await act(async () => {
      await result.current.searchCommanders("NonexistentCommander");
    });

    await waitFor(() => {
      expect(result.current.error).toBe(
        'No commanders found matching "NonexistentCommander". Try a different search term.'
      );
      expect(result.current.searchResults).toEqual([]);
    });
  });

  it("should handle empty query", async () => {
    const { result } = renderHook(() => useCommanderSearch());

    await act(async () => {
      await result.current.searchCommanders("");
    });

    expect(result.current.searchResults).toEqual([]);
    expect(result.current.error).toBeNull();
    expect(mockSearchCommanders).not.toHaveBeenCalled();
  });

  it("should select a commander", async () => {
    const mockCard: Card = {
      id: "test-id",
      object: "card",
      name: "Atraxa, Praetors' Voice",
      lang: "en",
      released_at: "2023-01-01",
      uri: "https://api.scryfall.com/cards/test-id",
      scryfall_uri: "https://scryfall.com/card/test/1/atraxa",
      layout: "normal",
      type_line: "Legendary Creature — Phyrexian Angel Horror",
      mana_cost: "{G}{W}{U}{B}",
      color_identity: ["B", "G", "U", "W"],
      legalities: { commander: "legal" },
      set: "test",
      set_name: "Test Set",
      set_type: "core",
      collector_number: "1",
      digital: false,
      rarity: "rare",
      border_color: "black",
      frame: "2015",
      full_art: false,
      textless: false,
      games: ["paper"],
      reserved: false,
      foil: false,
      nonfoil: true,
      oversized: false,
      promo: false,
      reprint: false,
    };

    const { result } = renderHook(() => useCommanderSearch());

    act(() => {
      result.current.selectCommander(mockCard);
    });

    expect(result.current.selectedCard).toEqual(mockCard);
    expect(result.current.searchResults).toEqual([]); // Should be cleared
    expect(result.current.error).toBeNull();
  });

  it("should clear selection", async () => {
    const mockCard: Card = {
      id: "test-id",
      object: "card",
      name: "Test Commander",
      lang: "en",
      released_at: "2023-01-01",
      uri: "https://api.scryfall.com/cards/test-id",
      scryfall_uri: "https://scryfall.com/card/test/1",
      layout: "normal",
      legalities: { commander: "legal" },
      set: "test",
      set_name: "Test Set",
      set_type: "core",
      collector_number: "1",
      digital: false,
      rarity: "rare",
      border_color: "black",
      frame: "2015",
      full_art: false,
      textless: false,
      games: ["paper"],
      reserved: false,
      foil: false,
      nonfoil: true,
      oversized: false,
      promo: false,
      reprint: false,
    };

    const { result } = renderHook(() => useCommanderSearch());

    // First select a commander
    act(() => {
      result.current.selectCommander(mockCard);
    });

    expect(result.current.selectedCard).toEqual(mockCard);

    // Then clear selection
    act(() => {
      result.current.clearSelection();
    });

    expect(result.current.selectedCard).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it("should clear results", async () => {
    const mockCards: Card[] = [
      {
        id: "test-id",
        object: "card",
        name: "Test Commander",
        lang: "en",
        released_at: "2023-01-01",
        uri: "https://api.scryfall.com/cards/test-id",
        scryfall_uri: "https://scryfall.com/card/test/1",
        layout: "normal",
        legalities: { commander: "legal" },
        set: "test",
        set_name: "Test Set",
        set_type: "core",
        collector_number: "1",
        digital: false,
        rarity: "rare",
        border_color: "black",
        frame: "2015",
        full_art: false,
        textless: false,
        games: ["paper"],
        reserved: false,
        foil: false,
        nonfoil: true,
        oversized: false,
        promo: false,
        reprint: false,
      },
    ];

    mockSearchCommanders.mockResolvedValue(mockCards);

    const { result } = renderHook(() => useCommanderSearch());

    // First search for commanders
    await act(async () => {
      await result.current.searchCommanders("test");
    });

    await waitFor(() => {
      expect(result.current.searchResults).toEqual(mockCards);
    });

    // Then clear results
    act(() => {
      result.current.clearResults();
    });

    expect(result.current.searchResults).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  it("should set loading state during search", async () => {
    let resolvePromise: (value: Card[]) => void;
    const searchPromise = new Promise<Card[]>((resolve) => {
      resolvePromise = resolve;
    });

    mockSearchCommanders.mockReturnValue(searchPromise);

    const { result } = renderHook(() => useCommanderSearch());

    // Start the search
    act(() => {
      result.current.searchCommanders("test");
    });

    // Should be loading
    expect(result.current.isLoading).toBe(true);

    // Resolve the promise
    await act(async () => {
      resolvePromise!([]);
      await searchPromise;
    });

    // Should no longer be loading
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
  });
});
