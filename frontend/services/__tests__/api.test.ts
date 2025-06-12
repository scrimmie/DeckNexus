import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { DeckNexusApi } from "../api";
import type { Card } from "@/types/scryfall";

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

const mockCard: Card = {
  id: "12345678-1234-1234-1234-123456789012",
  name: "Lightning Bolt",
  type_line: "Instant",
  mana_cost: "{R}",
  cmc: 1,
  oracle_text: "Lightning Bolt deals 3 damage to any target.",
  colors: ["R"],
  color_identity: ["R"],
  legalities: { commander: "legal" },
  set: "lea",
  set_name: "Limited Edition Alpha",
  rarity: "common",
  object: "card",
  lang: "en",
  released_at: "1993-08-05",
  uri: "https://api.scryfall.com/cards/12345",
  scryfall_uri: "https://scryfall.com/card/lea/161",
  layout: "normal",
  set_type: "core",
  collector_number: "161",
  digital: false,
  border_color: "black",
  frame: "1993",
  full_art: false,
  textless: false,
  games: ["paper", "mtgo"],
  reserved: false,
  foil: false,
  nonfoil: true,
  oversized: false,
  promo: false,
  reprint: false,
};

const mockCommander: Card = {
  ...mockCard,
  id: "87654321-4321-4321-4321-210987654321",
  name: "Edgar Markov",
  type_line: "Legendary Creature — Vampire Knight",
  oracle_text:
    "Eminence — Whenever you cast another Vampire spell, create a 1/1 black Vampire creature token.",
};

describe("DeckNexusApi", () => {
  let api: DeckNexusApi;

  beforeEach(() => {
    api = new DeckNexusApi();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("searchCommanders", () => {
    it("should search for commanders successfully", async () => {
      const mockResponse = {
        status: "success",
        data: [mockCommander],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await api.searchCommanders("Edgar");

      expect(result).toEqual([mockCommander]);
      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:3001/api/v1/cards/commanders/search?name=Edgar",
        expect.objectContaining({
          headers: {
            "Content-Type": "application/json",
          },
        })
      );
    });

    it("should return empty array for empty query", async () => {
      const result = await api.searchCommanders("");
      expect(result).toEqual([]);
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("should handle API errors", async () => {
      const mockError = {
        status: "error",
        message: "Commander not found",
      };

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: () => Promise.resolve(mockError),
      });

      await expect(api.searchCommanders("NonExistent")).rejects.toThrow(
        "Commander not found"
      );
    });

    it("should handle network errors", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      await expect(api.searchCommanders("Test")).rejects.toThrow(
        "Network error"
      );
    });
  });

  describe("searchCards", () => {
    it("should search for cards with filters", async () => {
      const mockResponse = {
        status: "success",
        data: [mockCard],
        pagination: {
          page: 1,
          limit: 20,
          total: 1,
          hasMore: false,
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await api.searchCards({
        name: "Lightning",
        type: "instant",
        page: 1,
        limit: 20,
      });

      expect(result.cards).toEqual([mockCard]);
      expect(result.hasMore).toBe(false);
      expect(result.total).toBe(1);

      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:3001/api/v1/cards/search?name=Lightning&type=instant&page=1&limit=20",
        expect.objectContaining({
          headers: {
            "Content-Type": "application/json",
          },
        })
      );
    });

    it("should handle empty search results", async () => {
      const mockResponse = {
        status: "success",
        data: [],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await api.searchCards({ name: "NonExistent" });

      expect(result.cards).toEqual([]);
      expect(result.total).toBe(0);
    });
  });

  describe("getCardById", () => {
    it("should get a card by ID", async () => {
      const mockResponse = {
        status: "success",
        data: mockCard,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await api.getCardById(
        "12345678-1234-1234-1234-123456789012"
      );

      expect(result).toEqual(mockCard);
      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:3001/api/v1/cards/12345678-1234-1234-1234-123456789012",
        expect.objectContaining({
          headers: {
            "Content-Type": "application/json",
          },
        })
      );
    });

    it("should handle card not found", async () => {
      const mockError = {
        status: "error",
        message: "Card not found",
      };

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: () => Promise.resolve(mockError),
      });

      await expect(api.getCardById("invalid-id")).rejects.toThrow(
        "Card not found"
      );
    });
  });

  describe("getRandomCard", () => {
    it("should get a random card", async () => {
      const mockResponse = {
        status: "success",
        data: mockCard,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await api.getRandomCard();

      expect(result).toEqual(mockCard);
      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:3001/api/v1/cards/random",
        expect.objectContaining({
          headers: {
            "Content-Type": "application/json",
          },
        })
      );
    });
  });

  describe("healthCheck", () => {
    it("should perform health check", async () => {
      const mockResponse = {
        status: "success",
        data: {
          status: "healthy",
          uptime: 12345,
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await api.healthCheck();

      expect(result.status).toBe("healthy");
      expect(result.uptime).toBe(12345);
      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:3001/health",
        expect.objectContaining({
          headers: {
            "Content-Type": "application/json",
          },
        })
      );
    });
  });
});
