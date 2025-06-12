import type {
  AIProvider,
  CommanderPlan,
  LandPool,
  CreaturePool,
  SpellPool,
  FinalDeck,
  CardPoolItem,
  AIProviderConfig,
} from "@/types/deckbuilder";
import type { Card } from "@/types/scryfall";
import {
  getCommanderPlanPrompt,
  getLandBatchPrompt,
  getFinalLandSelectionPrompt,
  getCreatureBatchPrompt,
  getFinalCreatureSelectionPrompt,
  getSpellBatchPrompt,
  getFinalSpellSelectionPrompt,
  getOptimizeCutsPrompt,
} from "./prompts";

export class LocalAIProvider implements AIProvider {
  private baseUrl: string;
  private model: string;

  constructor(config: AIProviderConfig["localConfig"] = {}) {
    this.baseUrl = config.baseUrl || "http://localhost:1234";
    this.model = config.model || "default";
  }

  /**
   * Check if the local AI service is available
   */
  async isAvailable(): Promise<boolean> {
    console.log(`🔍 Checking local AI service availability at ${this.baseUrl}`);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

      const response = await fetch(`${this.baseUrl}/v1/models`, {
        method: "GET",
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const isAvailable = response.ok;
      console.log(
        `${isAvailable ? "✅" : "❌"} Local AI service ${
          isAvailable ? "available" : "unavailable"
        }`
      );
      return isAvailable;
    } catch (error) {
      console.error("❌ Local AI service unavailable:", error);
      return false;
    }
  }

  private async makeRequest(
    messages: Array<{ role: string; content: string }>
  ): Promise<string> {
    console.log(`🤖 Local AI: Making request to ${this.baseUrl}`);

    // Check if service is available first
    const isAvailable = await this.isAvailable();
    if (!isAvailable) {
      console.warn("⚠️ Local AI service unavailable, using mock response");
      return this.getMockResponse(messages[0]?.content || "");
    }

    try {
      console.log(`⏱️ Starting AI request (timeout: 2m)`);
      const requestStartTime = Date.now();

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 120000); // 2 minute timeout

      const response = await fetch(`${this.baseUrl}/v1/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: this.model,
          messages,
          temperature: 0.7,
          max_tokens: 2000,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`LM Studio API error: ${response.statusText}`);
      }

      const data = await response.json();
      const responseTime = Date.now() - requestStartTime;
      const content = data.choices[0]?.message?.content || "";

      console.log(`✅ Local AI response received`, {
        responseTime: `${responseTime}ms`,
        contentLength: content.length,
        model: this.model,
      });

      return content;
    } catch (error) {
      console.error("❌ Local AI provider error:", error);
      console.warn("🔄 Falling back to mock response");
      // Fallback to mock responses for development
      return this.getMockResponse(messages[0]?.content || "");
    }
  }

  private getMockResponse(prompt: string): string {
    // Simple mock responses for development/testing
    if (
      prompt.includes("commander plan") ||
      prompt.includes("rankedStrategies")
    ) {
      return JSON.stringify({
        rankedStrategies: [
          {
            rank: 1,
            name: "Value Engine",
            description:
              "Build a solid midrange deck with good creatures and value spells",
            winConditions: ["Combat damage", "Value engine"],
            archetypes: ["Midrange", "Value"],
            keyThemes: ["Card advantage", "Efficient threats"],
          },
          {
            rank: 2,
            name: "Aggressive Beatdown",
            description: "Fast aggressive strategy with efficient threats",
            winConditions: ["Combat damage"],
            archetypes: ["Aggro"],
            keyThemes: ["Speed", "Pressure"],
          },
          {
            rank: 3,
            name: "Control Plan",
            description: "Late game control with card advantage",
            winConditions: ["Control win"],
            archetypes: ["Control"],
            keyThemes: ["Card draw", "Removal"],
          },
        ],
      });
    }
    // Add more mock responses as needed
    return "{}";
  }

  async generateCommanderPlan(
    commander: Card,
    cardPool: CardPoolItem[]
  ): Promise<CommanderPlan> {
    const prompt = getCommanderPlanPrompt(commander, cardPool.length);

    const response = await this.makeRequest([
      { role: "user", content: prompt },
    ]);

    try {
      const parsed = JSON.parse(response);
      const primaryStrategy =
        parsed.rankedStrategies.find((s: any) => s.rank === 1) ||
        parsed.rankedStrategies[0];

      return {
        rankedStrategies: parsed.rankedStrategies,
        primaryStrategy,
        // Legacy compatibility
        winConditions: primaryStrategy.winConditions,
        archetypes: primaryStrategy.archetypes,
        strategy: primaryStrategy.description,
        keyThemes: primaryStrategy.keyThemes,
      };
    } catch {
      // Fallback plan
      const fallbackStrategy = {
        name: "Value Engine",
        description: `Build around ${commander.name}'s abilities for incremental advantage`,
        winConditions: ["Combat damage", "Value engine"],
        archetypes: ["Midrange"],
        keyThemes: ["Synergy", "Card advantage"],
      };

      return {
        rankedStrategies: [
          { rank: 1, ...fallbackStrategy },
          {
            rank: 2,
            name: "Aggro",
            description: "Fast pressure",
            winConditions: ["Combat damage"],
            archetypes: ["Aggro"],
            keyThemes: ["Speed"],
          },
          {
            rank: 3,
            name: "Control",
            description: "Late game control",
            winConditions: ["Control win"],
            archetypes: ["Control"],
            keyThemes: ["Card draw"],
          },
        ],
        primaryStrategy: fallbackStrategy,
        winConditions: fallbackStrategy.winConditions,
        archetypes: fallbackStrategy.archetypes,
        strategy: fallbackStrategy.description,
        keyThemes: fallbackStrategy.keyThemes,
      };
    }
  }

  async selectLands(
    plan: CommanderPlan,
    cardPool: CardPoolItem[]
  ): Promise<LandPool> {
    const landCards = cardPool.filter((card) =>
      card.type_line.toLowerCase().includes("land")
    );

    const basics = this.sortByEDHRank(
      landCards.filter((card) => card.type_line.toLowerCase().includes("basic"))
    );

    const nonBasics = this.sortByEDHRank(
      landCards.filter(
        (card) => !card.type_line.toLowerCase().includes("basic")
      )
    );

    console.log(
      `🏞️ Processing ${basics.length} basic lands and ${nonBasics.length} non-basic lands in batches`
    );

    // Process basics - usually small enough for single query
    let basicCandidates: CardPoolItem[] = [];
    if (basics.length > 0) {
      basicCandidates = await this.processBatchedLands(basics, plan, "basic");
    }

    // Process non-basics in batches
    let nonBasicCandidates: CardPoolItem[] = [];
    if (nonBasics.length > 0) {
      nonBasicCandidates = await this.processBatchedLands(
        nonBasics,
        plan,
        "non-basic"
      );
    }

    // Final land selection from all candidates
    const finalSelection = await this.finalLandSelection(
      basicCandidates,
      nonBasicCandidates,
      plan
    );

    return finalSelection;
  }

  private async processBatchedLands(
    lands: CardPoolItem[],
    plan: CommanderPlan,
    type: "basic" | "non-basic"
  ): Promise<CardPoolItem[]> {
    const batchSize = type === "basic" ? 20 : 30; // Reduced batch sizes to avoid token limits
    const batches = this.createBatches(lands, batchSize);
    const allCandidates: CardPoolItem[] = [];

    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      console.log(
        `🏞️ Processing ${type} land batch ${i + 1}/${batches.length} (${
          batch.length
        } lands)`
      );

      const candidatesPerBatch =
        type === "basic"
          ? Math.ceil(batch.length * 0.8)
          : Math.ceil(batch.length * 0.25);

      const prompt = getLandBatchPrompt(
        batch,
        plan,
        type,
        i,
        batches.length,
        candidatesPerBatch
      );

      try {
        const response = await this.makeRequest([
          { role: "user", content: prompt },
        ]);
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        const jsonString = jsonMatch ? jsonMatch[0] : response;
        const batchResult = JSON.parse(jsonString);

        // Match AI selections to actual cards
        for (const selection of batchResult.selectedLands) {
          const matchingLand = batch.find(
            (land) =>
              land.name.toLowerCase().includes(selection.name.toLowerCase()) ||
              selection.name.toLowerCase().includes(land.name.toLowerCase()) ||
              this.fuzzyMatch(land.name, selection.name)
          );

          if (matchingLand && !allCandidates.includes(matchingLand)) {
            allCandidates.push(matchingLand);
          }
        }

        console.log(
          `🏞️ Batch ${i + 1} selected ${
            batchResult.selectedLands.length
          } candidates: ${batchResult.batchReasoning}`
        );
      } catch (error) {
        console.error(`Failed to process ${type} land batch ${i + 1}:`, error);
        // Fallback: take top-ranked cards from batch
        const fallbackCount = Math.min(candidatesPerBatch, batch.length);
        allCandidates.push(...batch.slice(0, fallbackCount));
      }
    }

    console.log(
      `🏞️ Total ${type} candidates collected: ${allCandidates.length}`
    );
    return allCandidates;
  }

  private async finalLandSelection(
    basicCandidates: CardPoolItem[],
    nonBasicCandidates: CardPoolItem[],
    plan: CommanderPlan
  ): Promise<LandPool> {
    console.log(
      `🏞️ Final land selection from ${basicCandidates.length} basic + ${nonBasicCandidates.length} non-basic candidates`
    );

    const prompt = getFinalLandSelectionPrompt(
      basicCandidates,
      nonBasicCandidates,
      plan
    );

    try {
      const response = await this.makeRequest([
        { role: "user", content: prompt },
      ]);
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      const jsonString = jsonMatch ? jsonMatch[0] : response;
      const aiSelection = JSON.parse(jsonString);

      // Convert AI selections to actual cards
      const selectedBasics: CardPoolItem[] = [];
      const selectedNonBasics: CardPoolItem[] = [];

      // Match AI selections to actual cards
      for (const selection of aiSelection.selectedBasics) {
        const matchingCards = basicCandidates.filter(
          (land) =>
            land.name.toLowerCase().includes(selection.name.toLowerCase()) ||
            selection.name.toLowerCase().includes(land.name.toLowerCase())
        );

        const count = Math.min(selection.count || 1, matchingCards.length);
        selectedBasics.push(...matchingCards.slice(0, count));
      }

      for (const selection of aiSelection.selectedNonBasics) {
        const matchingCard = nonBasicCandidates.find(
          (land) =>
            land.name.toLowerCase().includes(selection.name.toLowerCase()) ||
            selection.name.toLowerCase().includes(land.name.toLowerCase())
        );

        if (matchingCard) {
          selectedNonBasics.push(matchingCard);
        }
      }

      // Ensure we have the right count
      const targetCount = Math.min(aiSelection.totalCount || 36, 37);
      const currentCount = selectedBasics.length + selectedNonBasics.length;

      if (currentCount < targetCount) {
        // Fill remaining slots with basic lands
        const remaining = targetCount - currentCount;
        const additionalBasics = basicCandidates
          .filter((b) => !selectedBasics.includes(b))
          .slice(0, remaining);
        selectedBasics.push(...additionalBasics);
      }

      console.log(`🏞️ AI Land Selection: ${aiSelection.strategicReasoning}`);

      return {
        basics: selectedBasics,
        nonBasics: selectedNonBasics,
        totalLands: selectedBasics.length + selectedNonBasics.length,
        manaBase: this.calculateManaBase(selectedBasics, selectedNonBasics),
      };
    } catch (error) {
      console.error("AI land selection failed, using fallback:", error);

      // Fallback to simple selection
      const isAggro = plan.primaryStrategy.archetypes.some((arch) =>
        arch.toLowerCase().includes("aggro")
      );
      const landCount = isAggro ? 35 : 37;
      const basicCount = Math.floor(landCount * 0.6);
      const nonBasicCount = landCount - basicCount;

      const selectedBasics = basicCandidates.slice(0, basicCount);
      const selectedNonBasics = nonBasicCandidates.slice(0, nonBasicCount);

      console.log(
        `🏞️ Fallback land selection for strategy: ${plan.primaryStrategy.name} (${landCount} lands)`
      );

      return {
        basics: selectedBasics,
        nonBasics: selectedNonBasics,
        totalLands: selectedBasics.length + selectedNonBasics.length,
        manaBase: this.calculateManaBase(selectedBasics, selectedNonBasics),
      };
    }
  }

  private calculateManaBase(
    basics: CardPoolItem[],
    nonBasics: CardPoolItem[]
  ): Record<string, number> {
    const manaBase: Record<string, number> = { W: 0, U: 0, B: 0, R: 0, G: 0 };

    [...basics, ...nonBasics].forEach((land) => {
      // Simple heuristic for mana production
      const colors = land.oracle_text.match(/\{[WUBRG]\}/g) || [];
      colors.forEach((color) => {
        const colorLetter = color.charAt(1);
        if (manaBase[colorLetter] !== undefined) {
          manaBase[colorLetter]++;
        }
      });
    });

    return manaBase;
  }

  async pickCreatures(
    plan: CommanderPlan,
    lands: LandPool,
    cardPool: CardPoolItem[]
  ): Promise<CreaturePool> {
    const creatures = this.sortByEDHRank(
      cardPool.filter((card) =>
        card.type_line.toLowerCase().includes("creature")
      )
    );

    console.log(`🐉 Processing ${creatures.length} creatures in batches`);

    // Process creatures in batches
    const creatureCandidates = await this.processBatchedCreatures(
      creatures,
      plan,
      lands
    );

    // Final creature selection from all candidates
    const finalSelection = await this.finalCreatureSelection(
      creatureCandidates,
      plan,
      lands
    );

    return finalSelection;
  }

  private async processBatchedCreatures(
    creatures: CardPoolItem[],
    plan: CommanderPlan,
    lands: LandPool
  ): Promise<CardPoolItem[]> {
    const batchSize = 30; // Reduced batch size to avoid token limits
    const batches = this.createBatches(creatures, batchSize);
    const allCandidates: CardPoolItem[] = [];

    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      console.log(
        `🐉 Processing creature batch ${i + 1}/${batches.length} (${
          batch.length
        } creatures)`
      );

      const candidatesPerBatch = Math.ceil(batch.length * 0.3); // Take top 30% from each batch

      const prompt = getCreatureBatchPrompt(
        batch,
        plan,
        lands,
        i,
        batches.length,
        candidatesPerBatch,
        this.extractCMC.bind(this)
      );

      try {
        const response = await this.makeRequest([
          { role: "user", content: prompt },
        ]);
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        const jsonString = jsonMatch ? jsonMatch[0] : response;
        const batchResult = JSON.parse(jsonString);

        // Match AI selections to actual cards
        for (const selection of batchResult.selectedCreatures) {
          const matchingCreature = batch.find(
            (creature) =>
              creature.name
                .toLowerCase()
                .includes(selection.name.toLowerCase()) ||
              selection.name
                .toLowerCase()
                .includes(creature.name.toLowerCase()) ||
              this.fuzzyMatch(creature.name, selection.name)
          );

          if (matchingCreature && !allCandidates.includes(matchingCreature)) {
            allCandidates.push(matchingCreature);
          }
        }

        console.log(
          `🐉 Batch ${i + 1} selected ${
            batchResult.selectedCreatures.length
          } candidates: ${batchResult.batchReasoning}`
        );
      } catch (error) {
        console.error(`Failed to process creature batch ${i + 1}:`, error);
        // Fallback: take top-ranked cards from batch
        const fallbackCount = Math.min(candidatesPerBatch, batch.length);
        allCandidates.push(...batch.slice(0, fallbackCount));
      }
    }

    console.log(
      `🐉 Total creature candidates collected: ${allCandidates.length}`
    );
    return allCandidates;
  }

  private async finalCreatureSelection(
    creatureCandidates: CardPoolItem[],
    plan: CommanderPlan,
    lands: LandPool
  ): Promise<CreaturePool> {
    console.log(
      `🐉 Final creature selection from ${creatureCandidates.length} candidates`
    );

    // Determine target creature count based on strategy
    const isAggro = plan.primaryStrategy.archetypes.some((arch) =>
      arch.toLowerCase().includes("aggro")
    );
    const targetCount = isAggro ? 30 : 26;

    const prompt = getFinalCreatureSelectionPrompt(
      creatureCandidates,
      plan,
      lands,
      targetCount,
      this.extractCMC.bind(this)
    );

    try {
      const response = await this.makeRequest([
        { role: "user", content: prompt },
      ]);
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      const jsonString = jsonMatch ? jsonMatch[0] : response;
      const aiSelection = JSON.parse(jsonString);

      // Convert AI selections to actual cards
      const selectedCreatures: CardPoolItem[] = [];

      for (const selection of aiSelection.selectedCreatures) {
        const matchingCreature = creatureCandidates.find(
          (creature) =>
            creature.name
              .toLowerCase()
              .includes(selection.name.toLowerCase()) ||
            selection.name
              .toLowerCase()
              .includes(creature.name.toLowerCase()) ||
            this.fuzzyMatch(creature.name, selection.name)
        );

        if (matchingCreature && !selectedCreatures.includes(matchingCreature)) {
          selectedCreatures.push(matchingCreature);
        }
      }

      // Ensure we have enough creatures
      if (selectedCreatures.length < targetCount) {
        const remainingCreatures = creatureCandidates.filter(
          (c) => !selectedCreatures.includes(c)
        );
        const needed = targetCount - selectedCreatures.length;
        selectedCreatures.push(...remainingCreatures.slice(0, needed));
      }

      console.log(
        `🐉 AI Creature Selection: ${aiSelection.strategicReasoning}`
      );
      console.log(
        `🐉 Selected ${selectedCreatures.length} creatures for strategy: ${plan.primaryStrategy.name}`
      );

      return {
        creatures: selectedCreatures,
        totalCreatures: selectedCreatures.length,
        categoryBreakdown: this.categorizeCreatures(selectedCreatures),
      };
    } catch (error) {
      console.error("AI creature selection failed, using fallback:", error);

      // Fallback: Simple selection with strategy adjustments
      const selectedCreatures = creatureCandidates.slice(0, targetCount);

      console.log(
        `🐉 Fallback creature selection for strategy: ${plan.primaryStrategy.name} (${selectedCreatures.length} creatures)`
      );

      return {
        creatures: selectedCreatures,
        totalCreatures: selectedCreatures.length,
        categoryBreakdown: this.categorizeCreatures(selectedCreatures),
      };
    }
  }

  private fuzzyMatch(name1: string, name2: string): boolean {
    const clean1 = name1.toLowerCase().replace(/[^a-z0-9]/g, "");
    const clean2 = name2.toLowerCase().replace(/[^a-z0-9]/g, "");
    return (
      clean1.includes(clean2) ||
      clean2.includes(clean1) ||
      this.levenshteinDistance(clean1, clean2) < 3
    );
  }

  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1)
      .fill(null)
      .map(() => Array(str1.length + 1).fill(null));

    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;

    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,
          matrix[j - 1][i] + 1,
          matrix[j - 1][i - 1] + cost
        );
      }
    }

    return matrix[str2.length][str1.length];
  }

  private categorizeCreatures(
    creatures: CardPoolItem[]
  ): Record<string, number> {
    const categories = {
      "Low Cost (1-2 CMC)": 0,
      "Mid Range (3-4 CMC)": 0,
      "High Impact (5+ CMC)": 0,
      Utility: 0,
    };

    creatures.forEach((creature) => {
      const cmc = this.extractCMC(creature.mana_cost);
      if (cmc <= 2) categories["Low Cost (1-2 CMC)"]++;
      else if (cmc <= 4) categories["Mid Range (3-4 CMC)"]++;
      else categories["High Impact (5+ CMC)"]++;

      if (
        creature.oracle_text.toLowerCase().includes("draw") ||
        creature.oracle_text.toLowerCase().includes("destroy")
      ) {
        categories["Utility"]++;
      }
    });

    return categories;
  }

  private extractCMC(manaCost: string): number {
    const numericCost = manaCost.match(/\d+/);
    const symbolCount = (manaCost.match(/\{[WUBRGXYZ]\}/g) || []).length;
    return (numericCost ? parseInt(numericCost[0]) : 0) + symbolCount;
  }

  /**
   * Sort cards by EDHRank with unranked cards at the end
   * Lower EDHRank numbers = more popular/powerful cards
   */
  private sortByEDHRank(cards: CardPoolItem[]): CardPoolItem[] {
    return cards.sort((a, b) => {
      // Cards with EDHRank come first, sorted by rank (lower = better)
      if (a.edhrec_rank && b.edhrec_rank) {
        return a.edhrec_rank - b.edhrec_rank;
      }
      // Cards with EDHRank come before cards without
      if (a.edhrec_rank && !b.edhrec_rank) {
        return -1;
      }
      if (!a.edhrec_rank && b.edhrec_rank) {
        return 1;
      }
      // Both unranked - maintain original order
      return 0;
    });
  }

  /**
   * Split array into batches of specified size
   */
  private createBatches<T>(array: T[], batchSize: number): T[][] {
    const batches: T[][] = [];
    for (let i = 0; i < array.length; i += batchSize) {
      batches.push(array.slice(i, i + batchSize));
    }
    return batches;
  }

  async addSpells(
    plan: CommanderPlan,
    lands: LandPool,
    creatures: CreaturePool,
    cardPool: CardPoolItem[]
  ): Promise<SpellPool> {
    const spells = this.sortByEDHRank(
      cardPool.filter(
        (card) =>
          !card.type_line.toLowerCase().includes("creature") &&
          !card.type_line.toLowerCase().includes("land")
      )
    );

    const remainingSlots = 99 - lands.totalLands - creatures.totalCreatures;

    console.log(
      `⚡ Processing ${spells.length} spells in batches for ${remainingSlots} remaining slots`
    );

    // Process spells in batches
    const spellCandidates = await this.processBatchedSpells(
      spells,
      plan,
      lands,
      creatures
    );

    // Final spell selection from all candidates
    const finalSelection = await this.finalSpellSelection(
      spellCandidates,
      plan,
      lands,
      creatures,
      remainingSlots
    );

    return finalSelection;
  }

  private async processBatchedSpells(
    spells: CardPoolItem[],
    plan: CommanderPlan,
    lands: LandPool,
    creatures: CreaturePool
  ): Promise<CardPoolItem[]> {
    const batchSize = 30; // Reduced batch size to avoid token limits
    const batches = this.createBatches(spells, batchSize);
    const allCandidates: CardPoolItem[] = [];

    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      console.log(
        `⚡ Processing spell batch ${i + 1}/${batches.length} (${
          batch.length
        } spells)`
      );

      const candidatesPerBatch = Math.ceil(batch.length * 0.35); // Take top 35% from each batch

      const prompt = getSpellBatchPrompt(
        batch,
        plan,
        lands,
        creatures,
        i,
        batches.length,
        candidatesPerBatch,
        this.extractCMC.bind(this)
      );

      try {
        const response = await this.makeRequest([
          { role: "user", content: prompt },
        ]);
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        const jsonString = jsonMatch ? jsonMatch[0] : response;
        const batchResult = JSON.parse(jsonString);

        // Match AI selections to actual cards
        for (const selection of batchResult.selectedSpells) {
          const matchingSpell = batch.find(
            (spell) =>
              spell.name.toLowerCase().includes(selection.name.toLowerCase()) ||
              selection.name.toLowerCase().includes(spell.name.toLowerCase()) ||
              this.fuzzyMatch(spell.name, selection.name)
          );

          if (matchingSpell && !allCandidates.includes(matchingSpell)) {
            allCandidates.push(matchingSpell);
          }
        }

        console.log(
          `⚡ Batch ${i + 1} selected ${
            batchResult.selectedSpells.length
          } candidates: ${batchResult.batchReasoning}`
        );
      } catch (error) {
        console.error(`Failed to process spell batch ${i + 1}:`, error);
        // Fallback: take top-ranked cards from batch
        const fallbackCount = Math.min(candidatesPerBatch, batch.length);
        allCandidates.push(...batch.slice(0, fallbackCount));
      }
    }

    console.log(`⚡ Total spell candidates collected: ${allCandidates.length}`);
    return allCandidates;
  }

  private async finalSpellSelection(
    spellCandidates: CardPoolItem[],
    plan: CommanderPlan,
    lands: LandPool,
    creatures: CreaturePool,
    remainingSlots: number
  ): Promise<SpellPool> {
    console.log(
      `⚡ Final spell selection from ${spellCandidates.length} candidates for ${remainingSlots} slots`
    );

    const prompt = getFinalSpellSelectionPrompt(
      spellCandidates,
      plan,
      lands,
      creatures,
      remainingSlots,
      this.extractCMC.bind(this)
    );

    try {
      const response = await this.makeRequest([
        { role: "user", content: prompt },
      ]);
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      const jsonString = jsonMatch ? jsonMatch[0] : response;
      const aiSelection = JSON.parse(jsonString);

      // Convert AI selections to actual cards
      const selectedSpells: CardPoolItem[] = [];

      for (const selection of aiSelection.selectedSpells) {
        const matchingSpell = spellCandidates.find(
          (spell) =>
            spell.name.toLowerCase().includes(selection.name.toLowerCase()) ||
            selection.name.toLowerCase().includes(spell.name.toLowerCase()) ||
            this.fuzzyMatch(spell.name, selection.name)
        );

        if (matchingSpell && !selectedSpells.includes(matchingSpell)) {
          selectedSpells.push(matchingSpell);
        }
      }

      // Ensure we fill remaining slots
      if (selectedSpells.length < remainingSlots) {
        const remainingSpells = spellCandidates.filter(
          (s) => !selectedSpells.includes(s)
        );
        const needed = remainingSlots - selectedSpells.length;
        selectedSpells.push(...remainingSpells.slice(0, needed));
      }

      console.log(`⚡ AI Spell Selection: ${aiSelection.strategicReasoning}`);
      console.log(
        `⚡ Selected ${selectedSpells.length} spells for strategy: ${plan.primaryStrategy.name}`
      );

      return {
        spells: selectedSpells,
        totalSpells: selectedSpells.length,
        categoryBreakdown: this.categorizeSpells(selectedSpells),
      };
    } catch (error) {
      console.error("AI spell selection failed, using fallback:", error);

      // Fallback: Simple selection with strategy adjustments
      const selectedSpells = spellCandidates.slice(0, remainingSlots);

      console.log(
        `⚡ Fallback spell selection for strategy: ${plan.primaryStrategy.name} (${selectedSpells.length} spells)`
      );

      return {
        spells: selectedSpells,
        totalSpells: selectedSpells.length,
        categoryBreakdown: this.categorizeSpells(selectedSpells),
      };
    }
  }

  private categorizeSpells(spells: CardPoolItem[]): Record<string, number> {
    const categories = {
      Removal: 0,
      "Card Draw": 0,
      Ramp: 0,
      Protection: 0,
      "Win Conditions": 0,
      Utility: 0,
    };

    spells.forEach((spell) => {
      const lowerText = (spell.oracle_text + spell.type_line).toLowerCase();

      if (lowerText.includes("destroy") || lowerText.includes("exile")) {
        categories["Removal"]++;
      } else if (lowerText.includes("draw") || lowerText.includes("search")) {
        categories["Card Draw"]++;
      } else if (lowerText.includes("mana") || lowerText.includes("land")) {
        categories["Ramp"]++;
      } else if (
        lowerText.includes("counter") ||
        lowerText.includes("protect")
      ) {
        categories["Protection"]++;
      } else {
        categories["Utility"]++;
      }
    });

    return categories;
  }

  async optimizeCuts(
    plan: CommanderPlan,
    lands: LandPool,
    creatures: CreaturePool,
    spells: SpellPool,
    commander: Card
  ): Promise<FinalDeck> {
    // Ensure exactly 99 cards + commander
    const totalNonCommander =
      lands.totalLands + creatures.totalCreatures + spells.totalSpells;
    const targetCards = 99;

    let finalLands = [...lands.basics, ...lands.nonBasics];
    let finalCreatures = [...creatures.creatures];
    let finalSpells = [...spells.spells];

    // Intelligent cuts if over 99 cards
    if (totalNonCommander > targetCards) {
      const excess = totalNonCommander - targetCards;

      const prompt = getOptimizeCutsPrompt(
        plan,
        finalLands,
        finalCreatures,
        finalSpells,
        totalNonCommander,
        excess,
        this.extractCMC.bind(this)
      );

      try {
        const response = await this.makeRequest([
          { role: "user", content: prompt },
        ]);
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        const jsonString = jsonMatch ? jsonMatch[0] : response;
        const aiOptimization = JSON.parse(jsonString);

        // Apply AI-recommended cuts
        const cutsApplied = { lands: 0, creatures: 0, spells: 0 };

        for (const cut of aiOptimization.cutsToMake) {
          if (
            cutsApplied.lands + cutsApplied.creatures + cutsApplied.spells >=
            excess
          )
            break;

          switch (cut.cardType.toLowerCase()) {
            case "land":
              const landIndex = finalLands.findIndex(
                (land) =>
                  land.name
                    .toLowerCase()
                    .includes(cut.cardName.toLowerCase()) ||
                  this.fuzzyMatch(land.name, cut.cardName)
              );
              if (landIndex >= 0) {
                finalLands.splice(landIndex, 1);
                cutsApplied.lands++;
              }
              break;

            case "creature":
              const creatureIndex = finalCreatures.findIndex(
                (creature) =>
                  creature.name
                    .toLowerCase()
                    .includes(cut.cardName.toLowerCase()) ||
                  this.fuzzyMatch(creature.name, cut.cardName)
              );
              if (creatureIndex >= 0) {
                finalCreatures.splice(creatureIndex, 1);
                cutsApplied.creatures++;
              }
              break;

            case "spell":
              const spellIndex = finalSpells.findIndex(
                (spell) =>
                  spell.name
                    .toLowerCase()
                    .includes(cut.cardName.toLowerCase()) ||
                  this.fuzzyMatch(spell.name, cut.cardName)
              );
              if (spellIndex >= 0) {
                finalSpells.splice(spellIndex, 1);
                cutsApplied.spells++;
              }
              break;
          }
        }

        // If AI cuts weren't sufficient, make additional cuts using fallback logic
        const totalCutsApplied =
          cutsApplied.lands + cutsApplied.creatures + cutsApplied.spells;
        if (totalCutsApplied < excess) {
          const remaining = excess - totalCutsApplied;

          // Prioritize cutting spells first, then creatures
          if (finalSpells.length >= remaining) {
            finalSpells = finalSpells.slice(remaining);
          } else {
            const spellCuts = finalSpells.length;
            finalSpells = [];
            const creatureCuts = remaining - spellCuts;
            finalCreatures = finalCreatures.slice(creatureCuts);
          }
        }

        console.log(
          `⚖️ AI Optimization: ${aiOptimization.optimizationReasoning}`
        );
        console.log(
          `⚖️ Applied ${totalCutsApplied} AI cuts + ${
            excess - totalCutsApplied
          } fallback cuts`
        );
      } catch (error) {
        console.error("AI optimization failed, using fallback cuts:", error);

        // Fallback: Strategy-based cuts
        console.log(
          `⚖️ Making ${excess} fallback strategic cuts for strategy: ${plan.primaryStrategy.name}`
        );

        const isAggro = plan.primaryStrategy.archetypes.some((arch) =>
          arch.toLowerCase().includes("aggro")
        );

        if (isAggro) {
          // For aggro, cut high-cost spells first
          finalSpells = finalSpells.slice(
            0,
            finalSpells.length - Math.min(excess, finalSpells.length)
          );
          const remaining = excess - (spells.totalSpells - finalSpells.length);
          if (remaining > 0) {
            finalCreatures = finalCreatures.slice(
              0,
              finalCreatures.length - remaining
            );
          }
        } else {
          // For other strategies, cut spells first but more conservatively
          finalSpells = finalSpells.slice(0, finalSpells.length - excess);
        }
      }
    }

    // Calculate mana curve and color distribution
    const manaCurve: Record<number, number> = {};
    const colorDistribution: Record<string, number> = {};

    [...finalCreatures, ...finalSpells].forEach((card) => {
      // Parse mana cost for curve
      const cost = card.mana_cost.match(/\d+/)?.[0];
      const cmc = cost ? parseInt(cost) : 0;
      manaCurve[cmc] = (manaCurve[cmc] || 0) + 1;

      // Parse colors
      const colors = card.mana_cost.match(/[WUBRG]/g) || [];
      colors.forEach((color) => {
        colorDistribution[color] = (colorDistribution[color] || 0) + 1;
      });
    });

    return {
      commander,
      lands: finalLands,
      creatures: finalCreatures,
      spells: finalSpells,
      totalCards:
        finalLands.length + finalCreatures.length + finalSpells.length + 1,
      manaCurve,
      colorDistribution,
    };
  }
}
