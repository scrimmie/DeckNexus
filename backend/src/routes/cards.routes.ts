import { Router } from "express";
import { cardsController } from "@/controllers/cards.controller";
import { DeckBuilderController } from "@/controllers/deckbuilder.controller";

const router = Router();
const deckBuilderController = new DeckBuilderController();

/**
 * Cards Routes
 * Following REST API conventions:
 * - GET /cards/search - Search cards with filters
 * - GET /cards/commanders/search - Search commanders specifically
 * - GET /cards/random - Get random card
 * - GET /cards/pool/:commanderId - Get commander-legal card pool count
 * - GET /cards/:id - Get card by ID
 */

// Search cards with various filters
router.get("/search", cardsController.searchCards.bind(cardsController));

// Search commanders specifically
router.get(
  "/commanders/search",
  cardsController.searchCommanders.bind(cardsController)
);

// Get random card
router.get("/random", cardsController.getRandomCard.bind(cardsController));

// Get commander-legal card pool count
router.get(
  "/pool/:commanderId",
  deckBuilderController.getCardPool.bind(deckBuilderController)
);

// Get card by ID (must be last to avoid conflicts)
router.get("/:id", cardsController.getCardById.bind(cardsController));

export { router as cardsRoutes };
