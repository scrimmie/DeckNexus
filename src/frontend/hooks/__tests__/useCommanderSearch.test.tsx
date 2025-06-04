import { renderHook, waitFor, act } from "@testing-library/react";
import { beforeEach, describe, it, expect, vi } from "vitest";
import { useCommanderSearch } from "../useCommanderSearch";
import type { Card } from "@/types/scryfall";

// Mock the Scryfall client
vi.mock("@/services/scryfall", () => ({
  scryfallClient: {
    searchCommandersByName: vi.fn(),
    getCardByName: vi.fn(),
    isValidCommander: vi.fn(),
  },
}));

// Import after mocking
import { scryfallClient } from "@/services/scryfall";

const mockSearchCommandersByName = vi.mocked(
  scryfallClient.searchCommandersByName
);

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
        set_uri: "https://api.scryfall.com/sets/test",
        set_search_uri:
          "https://api.scryfall.com/cards/search?order=set&q=e%3Atest&unique=prints",
        scryfall_set_uri: "https://scryfall.com/sets/test",
        rulings_uri: "https://api.scryfall.com/cards/test-id/rulings",
        prints_search_uri:
          "https://api.scryfall.com/cards/search?order=released&q=oracleid%3Atest&unique=prints",
        collector_number: "1",
        digital: false,
        rarity: "rare",
        border_color: "black",
        frame: "2015",
        full_art: false,
        textless: false,
        booster: true,
        story_spotlight: false,
        games: ["paper"],
        reserved: false,
        foil: false,
        nonfoil: true,
        finishes: ["nonfoil"],
        oversized: false,
        promo: false,
        reprint: false,
        variation: false,
      },
    ];

    mockSearchCommandersByName.mockResolvedValue(mockCards);

    const { result } = renderHook(() => useCommanderSearch());

    await act(async () => {
      await result.current.searchCommanders("Atraxa");
    });

    await waitFor(() => {
      expect(result.current.searchResults).toEqual(mockCards);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    expect(mockSearchCommandersByName).toHaveBeenCalledWith("Atraxa");
  });

  it("should handle search errors gracefully", async () => {
    mockSearchCommandersByName.mockRejectedValue(new Error("Network error"));

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
    mockSearchCommandersByName.mockResolvedValue([]);

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
    expect(mockSearchCommandersByName).not.toHaveBeenCalled();
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
      set_uri: "https://api.scryfall.com/sets/test",
      set_search_uri:
        "https://api.scryfall.com/cards/search?order=set&q=e%3Atest&unique=prints",
      scryfall_set_uri: "https://scryfall.com/sets/test",
      rulings_uri: "https://api.scryfall.com/cards/test-id/rulings",
      prints_search_uri:
        "https://api.scryfall.com/cards/search?order=released&q=oracleid%3Atest&unique=prints",
      collector_number: "1",
      digital: false,
      rarity: "rare",
      border_color: "black",
      frame: "2015",
      full_art: false,
      textless: false,
      booster: true,
      story_spotlight: false,
      games: ["paper"],
      reserved: false,
      foil: false,
      nonfoil: true,
      finishes: ["nonfoil"],
      oversized: false,
      promo: false,
      reprint: false,
      variation: false,
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
      set_uri: "https://api.scryfall.com/sets/test",
      set_search_uri:
        "https://api.scryfall.com/cards/search?order=set&q=e%3Atest&unique=prints",
      scryfall_set_uri: "https://scryfall.com/sets/test",
      rulings_uri: "https://api.scryfall.com/cards/test-id/rulings",
      prints_search_uri:
        "https://api.scryfall.com/cards/search?order=released&q=oracleid%3Atest&unique=prints",
      collector_number: "1",
      digital: false,
      rarity: "rare",
      border_color: "black",
      frame: "2015",
      full_art: false,
      textless: false,
      booster: true,
      story_spotlight: false,
      games: ["paper"],
      reserved: false,
      foil: false,
      nonfoil: true,
      finishes: ["nonfoil"],
      oversized: false,
      promo: false,
      reprint: false,
      variation: false,
    };

    const { result } = renderHook(() => useCommanderSearch());

    // First select a commander
    act(() => {
      result.current.selectCommander(mockCard);
    });

    expect(result.current.selectedCard).toEqual(mockCard);

    // Then clear the selection
    act(() => {
      result.current.clearSelection();
    });

    expect(result.current.selectedCard).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it("should clear search results", async () => {
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
        set_uri: "https://api.scryfall.com/sets/test",
        set_search_uri:
          "https://api.scryfall.com/cards/search?order=set&q=e%3Atest&unique=prints",
        scryfall_set_uri: "https://scryfall.com/sets/test",
        rulings_uri: "https://api.scryfall.com/cards/test-id/rulings",
        prints_search_uri:
          "https://api.scryfall.com/cards/search?order=released&q=oracleid%3Atest&unique=prints",
        collector_number: "1",
        digital: false,
        rarity: "rare",
        border_color: "black",
        frame: "2015",
        full_art: false,
        textless: false,
        booster: true,
        story_spotlight: false,
        games: ["paper"],
        reserved: false,
        foil: false,
        nonfoil: true,
        finishes: ["nonfoil"],
        oversized: false,
        promo: false,
        reprint: false,
        variation: false,
      },
    ];

    mockSearchCommandersByName.mockResolvedValue(mockCards);

    const { result } = renderHook(() => useCommanderSearch());

    // First perform a search
    await act(async () => {
      await result.current.searchCommanders("Atraxa");
    });

    await waitFor(() => {
      expect(result.current.searchResults).toEqual(mockCards);
    });

    // Then clear the results
    act(() => {
      result.current.clearResults();
    });

    expect(result.current.searchResults).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  it("should handle loading states correctly", async () => {
    // Mock a slow response
    let resolveSearch: (value: Card[]) => void;
    const searchPromise = new Promise<Card[]>((resolve) => {
      resolveSearch = resolve;
    });

    mockSearchCommandersByName.mockReturnValue(searchPromise);

    const { result } = renderHook(() => useCommanderSearch());

    // Should not be loading initially
    expect(result.current.isLoading).toBe(false);

    // Start search without waiting for it to complete
    act(() => {
      result.current.searchCommanders("test");
    });

    // Should be loading now
    await waitFor(() => {
      expect(result.current.isLoading).toBe(true);
    });

    // Resolve the search
    act(() => {
      resolveSearch!([]);
    });

    // Should finish loading
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
  });
});
