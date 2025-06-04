import { beforeEach, describe, it, expect, vi } from "vitest";
import { ScryfallClient } from "../scryfall";
import type { Card, ScryfallList } from "@/types/scryfall";

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("ScryfallClient", () => {
  let client: ScryfallClient;

  beforeEach(() => {
    client = new ScryfallClient();
    mockFetch.mockClear();
  });

  describe("searchCommandersByName", () => {
    it("should return empty array for empty query", async () => {
      const result = await client.searchCommandersByName("");
      expect(result).toEqual([]);
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("should search for commanders and return sorted results", async () => {
      const mockCards: Card[] = [
        {
          id: "test-id-1",
          object: "card",
          name: "Atraxa, Grand Unifier",
          lang: "en",
          released_at: "2023-01-01",
          uri: "https://api.scryfall.com/cards/test-id-1",
          scryfall_uri: "https://scryfall.com/card/test/1/atraxa-grand-unifier",
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
          rulings_uri: "https://api.scryfall.com/cards/test-id-1/rulings",
          prints_search_uri:
            "https://api.scryfall.com/cards/search?order=released&q=oracleid%3Atest&unique=prints",
          collector_number: "1",
          digital: false,
          rarity: "mythic",
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
        {
          id: "test-id-2",
          object: "card",
          name: "Atraxa, Praetors' Voice",
          lang: "en",
          released_at: "2016-11-11",
          uri: "https://api.scryfall.com/cards/test-id-2",
          scryfall_uri:
            "https://scryfall.com/card/test/2/atraxa-praetors-voice",
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
          rulings_uri: "https://api.scryfall.com/cards/test-id-2/rulings",
          prints_search_uri:
            "https://api.scryfall.com/cards/search?order=released&q=oracleid%3Atest&unique=prints",
          collector_number: "2",
          digital: false,
          rarity: "mythic",
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

      const mockResponse: ScryfallList<Card> = {
        object: "list",
        total_cards: 2,
        has_more: false,
        data: mockCards,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await client.searchCommandersByName("Atraxa");

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe("Atraxa, Grand Unifier");
      expect(result[1].name).toBe("Atraxa, Praetors' Voice");

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/cards/search"),
        expect.objectContaining({
          headers: expect.objectContaining({
            "User-Agent": "DeckNexus/1.0",
            Accept: "application/json",
          }),
        })
      );
    });

    it("should handle API errors gracefully", async () => {
      const mockError = {
        object: "error",
        code: "bad_request",
        status: 400,
        details: "Invalid search query",
      };

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => mockError,
      });

      await expect(
        client.searchCommandersByName("invalid query")
      ).rejects.toThrow("Failed to search for commanders. Please try again.");
    });

    it("should filter out non-commander cards", async () => {
      const mockCards: Card[] = [
        {
          id: "test-id-1",
          object: "card",
          name: "Lightning Bolt",
          lang: "en",
          released_at: "2023-01-01",
          uri: "https://api.scryfall.com/cards/test-id-1",
          scryfall_uri: "https://scryfall.com/card/test/1/lightning-bolt",
          layout: "normal",
          type_line: "Instant", // Not a commander
          legalities: { commander: "legal" },
          set: "test",
          set_name: "Test Set",
          set_type: "core",
          set_uri: "https://api.scryfall.com/sets/test",
          set_search_uri:
            "https://api.scryfall.com/cards/search?order=set&q=e%3Atest&unique=prints",
          scryfall_set_uri: "https://scryfall.com/sets/test",
          rulings_uri: "https://api.scryfall.com/cards/test-id-1/rulings",
          prints_search_uri:
            "https://api.scryfall.com/cards/search?order=released&q=oracleid%3Atest&unique=prints",
          collector_number: "1",
          digital: false,
          rarity: "common",
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

      const mockResponse: ScryfallList<Card> = {
        object: "list",
        total_cards: 1,
        has_more: false,
        data: mockCards,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await client.searchCommandersByName("Lightning");

      expect(result).toEqual([]); // Should filter out non-commanders
    });
  });

  describe("rate limiting", () => {
    it("should respect rate limits between requests", async () => {
      const startTime = Date.now();

      // Mock successful responses
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            object: "list",
            total_cards: 0,
            has_more: false,
            data: [],
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            object: "list",
            total_cards: 0,
            has_more: false,
            data: [],
          }),
        });

      // Make two rapid requests
      await Promise.all([
        client.searchCommandersByName("test1"),
        client.searchCommandersByName("test2"),
      ]);

      const endTime = Date.now();

      // Should take at least 100ms due to rate limiting
      expect(endTime - startTime).toBeGreaterThanOrEqual(100);
    });

    it("should handle 429 rate limit errors with retry", async () => {
      // First call returns rate limit error, second succeeds
      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 429,
          json: async () => ({
            object: "error",
            code: "rate_limit_exceeded",
            status: 429,
            details: "Rate limit exceeded",
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            object: "list",
            total_cards: 0,
            has_more: false,
            data: [],
          }),
        });

      const result = await client.searchCommandersByName("test");

      expect(result).toEqual([]);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });
});
