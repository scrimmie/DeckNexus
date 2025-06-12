import { EventEmitter } from "events";
import type {
  DeckBuilderStage,
  FinalDeck,
  CardPoolItem,
  DeckBuilderRequest,
  AIProvider,
} from "@/types/deckbuilder";
import type { Card } from "@/types/scryfall";
import { AIProviderFactory } from "./ai/ai-provider.factory";
import { scryfallService } from "./scryfall.service";
import { ExternalServiceError } from "@/types/api";

export class DeckBuilderService extends EventEmitter {
  private static readonly CARD_POOL_LIMIT = 20000;
  private cardPoolCache = new Map<
    string,
    { data: CardPoolItem[]; expires: number }
  >();
  private readonly CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

  constructor() {
    super();
  }

  /**
   * Get commander-legal card pool for a given commander
   */
  async getCommanderLegalPool(commanderId: string): Promise<CardPoolItem[]> {
    console.log(`🔍 Checking card pool cache for commander ${commanderId}`);

    // Check cache first
    const cached = this.cardPoolCache.get(commanderId);
    if (cached && cached.expires > Date.now()) {
      console.log(`✅ Using cached card pool (${cached.data.length} cards)`);
      return cached.data;
    }

    try {
      console.log(
        `📡 Fetching commander data from Scryfall for ${commanderId}`
      );
      // Get the commander card
      const commander = await scryfallService.getCardById(commanderId);

      if (!commander.color_identity) {
        throw new ExternalServiceError(
          "Scryfall",
          "Commander has no color identity"
        );
      }

      console.log(`🎨 Building color query for ${commander.name}`, {
        colorIdentity: commander.color_identity,
      });

      // Build search query for commander-legal cards
      const colorQuery = this.buildColorQuery(commander.color_identity);
      console.log(`🔍 Scryfall query: ${colorQuery}`);

      let allCards: CardPoolItem[] = [];
      let page = 1;
      let hasMore = true;

      this.emit("progress", {
        type: "progress",
        stage: "processCommander" as DeckBuilderStage,
        progress: 0,
        message: "Fetching commander-legal cards...",
      });

      while (hasMore && allCards.length < DeckBuilderService.CARD_POOL_LIMIT) {
        const searchResult = await scryfallService.rawSearch(colorQuery, page);

        // Convert to simplified format
        const cards = searchResult.cards.map((card) =>
          this.convertToCardPoolItem(card)
        );
        allCards.push(...cards);

        hasMore = searchResult.hasMore;
        page++;

        // Update progress
        const progress = Math.min(95, (allCards.length / 10000) * 100);
        this.emit("progress", {
          type: "progress",
          stage: "processCommander" as DeckBuilderStage,
          progress,
          message: `Fetched ${allCards.length} cards...`,
        });

        // Safety check
        if (allCards.length >= DeckBuilderService.CARD_POOL_LIMIT) {
          throw new ExternalServiceError(
            "DeckBuilder",
            `Card pool too large (>${DeckBuilderService.CARD_POOL_LIMIT} cards). Please use a more specific commander.`
          );
        }
      }

      // Cache the result
      this.cardPoolCache.set(commanderId, {
        data: allCards,
        expires: Date.now() + this.CACHE_DURATION,
      });

      return allCards;
    } catch (error) {
      if (error instanceof ExternalServiceError) {
        throw error;
      }
      throw new ExternalServiceError(
        "Scryfall",
        `Failed to fetch card pool: ${error}`
      );
    }
  }

  /**
   * Build the 5-stage AI deck building pipeline
   */
  async buildDeck(
    request: DeckBuilderRequest,
    aiProvider?: AIProvider,
    requestId?: string
  ): Promise<FinalDeck> {
    const logPrefix = requestId ? `[${requestId}]` : "[deck-build]";

    try {
      // Get the commander
      console.log(`👑 ${logPrefix} Fetching commander data`);
      const commanderStartTime = Date.now();
      const commander = await scryfallService.getCardById(request.commanderId);
      console.log(`✅ ${logPrefix} Commander fetched: ${commander.name}`, {
        type: commander.type_line,
        colors: commander.color_identity,
        fetchTime: `${Date.now() - commanderStartTime}ms`,
      });

      const provider =
        aiProvider || AIProviderFactory.createProvider(request.model);

      // Get the card pool
      console.log(`🃏 ${logPrefix} Fetching commander-legal card pool`);
      const poolStartTime = Date.now();
      const cardPool = await this.getCommanderLegalPool(request.commanderId);
      console.log(`✅ ${logPrefix} Card pool fetched`, {
        totalCards: cardPool.length,
        fetchTime: `${Date.now() - poolStartTime}ms`,
      });

      this.emit("stageStarted", {
        type: "stageStarted",
        stage: "processCommander",
        message: `Analyzing ${commander.name} and creating strategic plan...`,
      });

      // Stage 1: Process Commander
      console.log(`🧠 ${logPrefix} Stage 1: Generating commander plan`);
      const stage1StartTime = Date.now();
      const commanderPlan = await provider.generateCommanderPlan(
        commander,
        cardPool
      );
      console.log(`✅ ${logPrefix} Stage 1 complete`, {
        strategy: commanderPlan.strategy.substring(0, 100) + "...",
        winConditions: commanderPlan.winConditions,
        archetypes: commanderPlan.archetypes,
        keyThemes: commanderPlan.keyThemes,
        duration: `${Date.now() - stage1StartTime}ms`,
      });

      this.emit("stageFinished", {
        type: "stageFinished",
        stage: "processCommander",
        result: commanderPlan,
        message: `Strategy: ${commanderPlan.strategy.substring(0, 100)}...`,
      });

      // Stage 2: Select Lands
      this.emit("stageStarted", {
        type: "stageStarted",
        stage: "selectLands",
        message: "Building optimal mana base...",
      });

      console.log(`🏞️ ${logPrefix} Stage 2: Selecting lands`);
      const stage2StartTime = Date.now();
      const landPool = await provider.selectLands(commanderPlan, cardPool);
      console.log(`✅ ${logPrefix} Stage 2 complete`, {
        totalLands: landPool.totalLands,
        basics: landPool.basics.length,
        nonBasics: landPool.nonBasics.length,
        manaBase: landPool.manaBase,
        duration: `${Date.now() - stage2StartTime}ms`,
      });

      this.emit("stageFinished", {
        type: "stageFinished",
        stage: "selectLands",
        result: landPool,
        message: `Selected ${landPool.totalLands} lands`,
      });

      // Stage 3: Pick Creatures
      this.emit("stageStarted", {
        type: "stageStarted",
        stage: "pickCreatures",
        message: "Selecting creature suite...",
      });

      console.log(`🐉 ${logPrefix} Stage 3: Selecting creatures`);
      const stage3StartTime = Date.now();
      const creaturePool = await provider.pickCreatures(
        commanderPlan,
        landPool,
        cardPool
      );
      console.log(`✅ ${logPrefix} Stage 3 complete`, {
        totalCreatures: creaturePool.totalCreatures,
        categoryBreakdown: creaturePool.categoryBreakdown,
        duration: `${Date.now() - stage3StartTime}ms`,
      });

      this.emit("stageFinished", {
        type: "stageFinished",
        stage: "pickCreatures",
        result: creaturePool,
        message: `Selected ${creaturePool.totalCreatures} creatures`,
      }); 

      // Stage 4: Add Spells
      this.emit("stageStarted", {
        type: "stageStarted",
        stage: "addSpells",
        message: "Adding spells and support cards...",
      });

      console.log(`⚡ ${logPrefix} Stage 4: Selecting spells`);
      const stage4StartTime = Date.now();
      const spellPool = await provider.addSpells(
        commanderPlan,
        landPool,
        creaturePool,
        cardPool
      );
      console.log(`✅ ${logPrefix} Stage 4 complete`, {
        totalSpells: spellPool.totalSpells,
        categoryBreakdown: spellPool.categoryBreakdown,
        duration: `${Date.now() - stage4StartTime}ms`,
      });

      this.emit("stageFinished", {
        type: "stageFinished",
        stage: "addSpells",
        result: spellPool,
        message: `Selected ${spellPool.totalSpells} spells`,
      });

      // Stage 5: Optimize and Cut
      this.emit("stageStarted", {
        type: "stageStarted",
        stage: "optimizeCuts",
        message: "Optimizing deck and making final cuts...",
      });

      console.log(
        `⚖️ ${logPrefix} Stage 5: Optimizing and cutting to 99 cards`
      );
      const stage5StartTime = Date.now();
      const finalDeck = await provider.optimizeCuts(
        commanderPlan,
        landPool,
        creaturePool,
        spellPool,
        commander
      );
      console.log(`✅ ${logPrefix} Stage 5 complete - Final deck ready`, {
        totalCards: finalDeck.totalCards,
        breakdown: {
          lands: finalDeck.lands.length,
          creatures: finalDeck.creatures.length,
          spells: finalDeck.spells.length,
        },
        manaCurve: finalDeck.manaCurve,
        colorDistribution: finalDeck.colorDistribution,
        duration: `${Date.now() - stage5StartTime}ms`,
      });

      this.emit("stageFinished", {
        type: "stageFinished",
        stage: "optimizeCuts",
        result: finalDeck,
        message: `Deck complete: ${finalDeck.totalCards} cards total`,
      });

      return finalDeck;
    } catch (error) {
      this.emit("error", {
        type: "error",
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      });
      throw error;
    }
  }

  /**
   * Convert Scryfall card to simplified CardPoolItem
   */
  private convertToCardPoolItem(card: Card): CardPoolItem {
    return {
      name: card.name,
      mana_cost: card.mana_cost || "",
      oracle_text: card.oracle_text || "",
      type_line: card.type_line || "",
      power: card.power,
      toughness: card.toughness,
      usd_price: card.prices?.usd ? parseFloat(card.prices.usd) : null,
      edhrec_rank: card.edhrec_rank,
    };
  }

  /**
   * Build color query for commander-legal cards
   */
  private buildColorQuery(colorIdentity: string[]): string {
    if (colorIdentity.length === 0) {
      // Colorless commander - can only play colorless cards and basic lands
      return "legal:commander ci:c";
    }

    // Build color identity query
    const colors = colorIdentity.join("");
    return `legal:commander ci<=${colors}`;
  }

  /**
   * Get count of cards in pool for a commander
   */
  async getCardPoolCount(commanderId: string): Promise<number> {
    const pool = await this.getCommanderLegalPool(commanderId);
    return pool.length;
  }
}

export const deckBuilderService = new DeckBuilderService();
