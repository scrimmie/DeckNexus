import { Request, Response, NextFunction } from "express";
import {
  DeckBuilderRequestSchema,
  CardPoolRequestSchema,
  type DeckBuilderEvent,
} from "@/types/deckbuilder";
import type { ApiResponse } from "@/types/api";
import { deckBuilderService } from "@/services/deckbuilder.service";
import { AIProviderFactory } from "@/services/ai/ai-provider.factory";

export class DeckBuilderController {
  /**
   * POST /api/v1/deckbuilder/build
   * Start AI deck building process with SSE progress updates
   */
  async buildDeck(req: Request, res: Response, next: NextFunction) {
    const requestId = `deck-${Date.now()}-${Math.random()
      .toString(36)
      .substr(2, 9)}`;
    const startTime = Date.now();

    console.log(`🚀 [${requestId}] Deck building request started`, {
      timestamp: new Date().toISOString(),
      body: req.body,
      userAgent: req.get("User-Agent"),
      ip: req.ip,
    });

    try {
      const validatedData = DeckBuilderRequestSchema.parse(req.body);

      console.log(`✅ [${requestId}] Request validation successful`, {
        commanderId: validatedData.commanderId,
        model: validatedData.model,
        options: validatedData.options,
      });

      // Set up Server-Sent Events
      res.writeHead(200, {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Cache-Control",
      });

      // Send initial connection confirmation
      res.write(
        `data: ${JSON.stringify({
          type: "connected",
          message: "Connected to deck builder service",
        })}\n\n`
      );

      // Set up event listeners for the service
      const handleStageStart = (event: DeckBuilderEvent) => {
        res.write(`data: ${JSON.stringify(event)}\n\n`);
      };

      const handleStageFinish = (event: DeckBuilderEvent) => {
        res.write(`data: ${JSON.stringify(event)}\n\n`);
      };

      const handleProgress = (event: DeckBuilderEvent) => {
        res.write(`data: ${JSON.stringify(event)}\n\n`);
      };

      const handleError = (event: DeckBuilderEvent) => {
        res.write(`data: ${JSON.stringify(event)}\n\n`);
        res.end();
      };

      // Subscribe to events
      deckBuilderService.on("stageStarted", handleStageStart);
      deckBuilderService.on("stageFinished", handleStageFinish);
      deckBuilderService.on("progress", handleProgress);
      deckBuilderService.on("error", handleError);

      try {
        // Validate AI provider availability first
        console.log(
          `🔍 [${requestId}] Validating AI provider: ${validatedData.model}`
        );
        const providerValidation = await AIProviderFactory.validateProvider(
          validatedData.model
        );

        if (!providerValidation.available) {
          console.log(`❌ [${requestId}] AI provider validation failed`, {
            provider: validatedData.model,
            message: providerValidation.message,
            duration: Date.now() - startTime,
          });

          const errorEvent = {
            type: "error" as const,
            error: providerValidation.message || "AI provider not available",
          };
          res.write(`data: ${JSON.stringify(errorEvent)}\n\n`);
          res.end();
          return;
        }

        console.log(`✅ [${requestId}] AI provider validation successful`, {
          provider: validatedData.model,
          message: providerValidation.message,
          validationTime: Date.now() - startTime,
        });

        // Send provider status message
        if (providerValidation.message) {
          res.write(
            `data: ${JSON.stringify({
              type: "connected",
              message: providerValidation.message,
            })}\n\n`
          );
        }

        // Start the deck building process
        console.log(`🏗️ [${requestId}] Starting deck building pipeline`);
        const pipelineStartTime = Date.now();

        const finalDeck = await deckBuilderService.buildDeck(
          validatedData,
          providerValidation.provider,
          requestId
        );

        const totalDuration = Date.now() - startTime;
        const pipelineDuration = Date.now() - pipelineStartTime;

        console.log(`🎉 [${requestId}] Deck building completed successfully`, {
          totalCards: finalDeck.totalCards,
          lands: finalDeck.lands.length,
          creatures: finalDeck.creatures.length,
          spells: finalDeck.spells.length,
          totalDuration: `${totalDuration}ms`,
          pipelineDuration: `${pipelineDuration}ms`,
        });

        // Send final result
        res.write(
          `data: ${JSON.stringify({
            type: "complete",
            result: finalDeck,
          })}\n\n`
        );

        res.end();
      } catch (error) {
        const duration = Date.now() - startTime;
        console.error(`💥 [${requestId}] Deck building failed`, {
          error: error instanceof Error ? error.message : "Unknown error",
          stack: error instanceof Error ? error.stack : undefined,
          duration: `${duration}ms`,
        });

        const errorEvent = {
          type: "error" as const,
          error:
            error instanceof Error ? error.message : "Unknown error occurred",
        };
        res.write(`data: ${JSON.stringify(errorEvent)}\n\n`);
        res.end();
      } finally {
        // Clean up event listeners
        deckBuilderService.removeListener("stageStarted", handleStageStart);
        deckBuilderService.removeListener("stageFinished", handleStageFinish);
        deckBuilderService.removeListener("progress", handleProgress);
        deckBuilderService.removeListener("error", handleError);
      }

      // Handle client disconnect
      req.on("close", () => {
        deckBuilderService.removeListener("stageStarted", handleStageStart);
        deckBuilderService.removeListener("stageFinished", handleStageFinish);
        deckBuilderService.removeListener("progress", handleProgress);
        deckBuilderService.removeListener("error", handleError);
        res.end();
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/deckbuilder/models
   * Get available AI models
   */
  async getAvailableModels(_req: Request, res: Response, next: NextFunction) {
    try {
      const models = await AIProviderFactory.getAvailableModels();

      const response: ApiResponse<string[]> = {
        status: "success",
        data: models,
        message: "Available AI models retrieved successfully",
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/cards/pool/:commanderId
   * Get commander-legal card pool count
   */
  async getCardPool(req: Request, res: Response, next: NextFunction) {
    try {
      const validatedParams = CardPoolRequestSchema.parse(req.params);

      const cardCount = await deckBuilderService.getCardPoolCount(
        validatedParams.commanderId
      );

      const response: ApiResponse<{ count: number }> = {
        status: "success",
        data: { count: cardCount },
        message: `Found ${cardCount} commander-legal cards`,
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }
}
