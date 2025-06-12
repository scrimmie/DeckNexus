import request from "supertest";
import app from "../index";
import { scryfallService } from "../services/scryfall.service";

// Mock the scryfall service
jest.mock("../services/scryfall.service", () => ({
  scryfallService: {
    searchCards: jest.fn(),
    searchCommanders: jest.fn(),
    getCardById: jest.fn(),
    getRandomCard: jest.fn(),
  },
}));

const mockCard = {
  id: "12345678-1234-1234-1234-123456789012",
  name: "Lightning Bolt",
  type_line: "Instant",
  mana_cost: "{R}",
  cmc: 1,
  oracle_text: "Lightning Bolt deals 3 damage to any target.",
  colors: ["R"],
  color_identity: ["R"],
  legalities: { commander: "legal" as const },
  set: "lea",
  set_name: "Limited Edition Alpha",
  rarity: "common" as const,
  object: "card" as const,
  lang: "en",
  released_at: "1993-08-05",
  uri: "https://api.scryfall.com/cards/12345",
  scryfall_uri: "https://scryfall.com/card/lea/161",
  layout: "normal",
  set_type: "core",
  set_uri: "https://api.scryfall.com/sets/lea",
  set_search_uri: "https://api.scryfall.com/cards/search?order=set&q=e%3Alea",
  scryfall_set_uri: "https://scryfall.com/sets/lea",
  rulings_uri: "https://api.scryfall.com/cards/12345/rulings",
  prints_search_uri:
    "https://api.scryfall.com/cards/search?order=released&q=oracletext%3A%22Lightning+Bolt%22",
  collector_number: "161",
  digital: false,
  border_color: "black" as const,
  frame: "1993",
  full_art: false,
  textless: false,
  booster: true,
  story_spotlight: false,
  games: ["paper", "mtgo"],
  reserved: false,
  foil: false,
  nonfoil: true,
  finishes: ["nonfoil"],
  oversized: false,
  promo: false,
  reprint: false,
  variation: false,
};

const mockCommander = {
  ...mockCard,
  id: "87654321-4321-4321-4321-210987654321",
  name: "Edgar Markov",
  type_line: "Legendary Creature — Vampire Knight",
  oracle_text:
    "Eminence — Whenever you cast another Vampire spell, if Edgar Markov is in the command zone or on the battlefield, create a 1/1 black Vampire creature token.",
};

describe("Cards API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /api/v1/cards/search", () => {
    it("should search for cards successfully", async () => {
      const mockResult = {
        cards: [mockCard],
        hasMore: false,
        total: 1,
      };

      (scryfallService.searchCards as jest.Mock).mockResolvedValue(mockResult);

      const response = await request(app)
        .get("/api/v1/cards/search")
        .query({ name: "Lightning Bolt" });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe("success");
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].name).toBe("Lightning Bolt");
      expect(response.body.pagination).toBeDefined();
    });

    it("should return validation error for invalid query", async () => {
      const response = await request(app)
        .get("/api/v1/cards/search")
        .query({ page: -1 });

      expect(response.status).toBe(400);
      expect(response.body.status).toBe("error");
      expect(response.body.message).toBe("Validation failed");
    });

    it("should handle service errors", async () => {
      (scryfallService.searchCards as jest.Mock).mockRejectedValue(
        new Error("Service error")
      );

      const response = await request(app)
        .get("/api/v1/cards/search")
        .query({ name: "test" });

      expect(response.status).toBe(500);
      expect(response.body.status).toBe("error");
    });
  });

  describe("GET /api/v1/cards/commanders/search", () => {
    it("should search for commanders successfully", async () => {
      (scryfallService.searchCommanders as jest.Mock).mockResolvedValue([
        mockCommander,
      ]);

      const response = await request(app)
        .get("/api/v1/cards/commanders/search")
        .query({ name: "Edgar" });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe("success");
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].name).toBe("Edgar Markov");
    });

    it("should return validation error when name is missing", async () => {
      const response = await request(app).get(
        "/api/v1/cards/commanders/search"
      );

      expect(response.status).toBe(400);
      expect(response.body.status).toBe("error");
      expect(response.body.message).toBe("Validation failed");
    });
  });

  describe("GET /api/v1/cards/random", () => {
    it("should return a random card", async () => {
      (scryfallService.getRandomCard as jest.Mock).mockResolvedValue(mockCard);

      const response = await request(app).get("/api/v1/cards/random");

      expect(response.status).toBe(200);
      expect(response.body.status).toBe("success");
      expect(response.body.data.name).toBe("Lightning Bolt");
    });
  });

  describe("GET /api/v1/cards/:id", () => {
    it("should return a card by ID", async () => {
      (scryfallService.getCardById as jest.Mock).mockResolvedValue(mockCard);

      const response = await request(app).get(
        "/api/v1/cards/12345678-1234-1234-1234-123456789012"
      );

      expect(response.status).toBe(200);
      expect(response.body.status).toBe("success");
      expect(response.body.data.name).toBe("Lightning Bolt");
    });

    it("should return validation error for invalid UUID", async () => {
      const response = await request(app).get("/api/v1/cards/invalid-uuid");

      expect(response.status).toBe(400);
      expect(response.body.status).toBe("error");
      expect(response.body.message).toBe("Validation failed");
    });
  });

  describe("GET /health", () => {
    it("should return health status", async () => {
      const response = await request(app).get("/health");

      expect(response.status).toBe(200);
      expect(response.body.status).toBe("success");
      expect(response.body.message).toBe("DeckNexus API is running");
      expect(response.body.data.timestamp).toBeDefined();
      expect(response.body.data.uptime).toBeDefined();
    });
  });

  describe("404 handler", () => {
    it("should return 404 for unknown routes", async () => {
      const response = await request(app).get("/api/v1/unknown");

      expect(response.status).toBe(404);
      expect(response.body.status).toBe("error");
      expect(response.body.message).toContain("not found");
    });
  });
});
