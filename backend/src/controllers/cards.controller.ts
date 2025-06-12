import { Request, Response, NextFunction } from "express";
import { scryfallService } from "@/services/scryfall.service";
import {
  ApiResponse,
  CardSearchSchema,
  CardByIdSchema,
  ValidationError,
  NotFoundError,
} from "@/types/api";
import type { Card } from "@/types/scryfall";

/**
 * Cards Controller
 * Handles all card-related endpoints following REST conventions
 */
export class CardsController {
  /**
   * GET /api/v1/cards/search
   * Search for cards with various filters
   */
  async searchCards(req: Request, res: Response, next: NextFunction) {
    try {
      const validatedQuery = CardSearchSchema.parse(req.query);

      const result = await scryfallService.searchCards({
        name: validatedQuery.name,
        type: validatedQuery.type,
        colors: validatedQuery.colors,
        cmc: validatedQuery.cmc,
        commander: validatedQuery.commander,
        page: validatedQuery.page,
        limit: validatedQuery.limit,
      });

      const response: ApiResponse<Card[]> = {
        status: "success",
        data: result.cards,
        pagination: {
          page: validatedQuery.page,
          limit: validatedQuery.limit,
          total: result.total || result.cards.length,
          hasMore: result.hasMore,
        },
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/cards/commanders/search
   * Search specifically for commanders by name
   */
  async searchCommanders(req: Request, res: Response, next: NextFunction) {
    try {
      const { name } = req.query;

      if (!name || typeof name !== "string") {
        throw new ValidationError({
          name: ["Name query parameter is required"],
        });
      }

      const commanders = await scryfallService.searchCommanders(name);

      const response: ApiResponse<Card[]> = {
        status: "success",
        data: commanders,
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/cards/random
   * Get a random card
   */
  async getRandomCard(_req: Request, res: Response, next: NextFunction) {
    try {
      const card = await scryfallService.getRandomCard();

      const response: ApiResponse<Card> = {
        status: "success",
        data: card,
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/cards/:id
   * Get a card by its Scryfall ID
   */
  async getCardById(req: Request, res: Response, next: NextFunction) {
    try {
      const validatedParams = CardByIdSchema.parse(req.params);

      const card = await scryfallService.getCardById(validatedParams.id);

      if (!card) {
        throw new NotFoundError("Card");
      }

      const response: ApiResponse<Card> = {
        status: "success",
        data: card,
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }
}

// Export singleton instance
export const cardsController = new CardsController();
