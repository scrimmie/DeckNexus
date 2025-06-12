import { Router } from "express";
import { DeckBuilderController } from "@/controllers/deckbuilder.controller";

const router = Router();
const deckBuilderController = new DeckBuilderController();

// POST /api/v1/deckbuilder/build - Build a deck with AI
router.post("/build", (req, res, next) =>
  deckBuilderController.buildDeck(req, res, next)
);

// GET /api/v1/deckbuilder/models - Get available AI models
router.get("/models", (req, res, next) =>
  deckBuilderController.getAvailableModels(req, res, next)
);

export default router;
