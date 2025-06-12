import { z } from "zod";
import type { Card } from "./scryfall";

// AI Provider configuration
export interface AIProviderConfig {
  type: "local" | "remote";
  localConfig?: {
    baseUrl?: string;
    model?: string;
  };
  remoteConfig?: {
    apiKey: string;
    baseUrl?: string;
    model?: string;
  };
}

// Card pool types
export interface CardPoolItem {
  name: string;
  mana_cost: string;
  oracle_text: string;
  type_line: string;
  power?: string;
  toughness?: string;
  usd_price: number | null;
  edhrec_rank?: number;
}

// Pipeline stage types
export interface CommanderPlan {
  rankedStrategies: Array<{
    rank: number;
    name: string;
    description: string;
    winConditions: string[];
    archetypes: string[];
    keyThemes: string[];
  }>;
  primaryStrategy: {
    name: string;
    description: string;
    winConditions: string[];
    archetypes: string[];
    keyThemes: string[];
  };
  // Legacy fields for compatibility
  winConditions: string[];
  archetypes: string[];
  strategy: string;
  keyThemes: string[];
}

export interface LandPool {
  basics: CardPoolItem[];
  nonBasics: CardPoolItem[];
  totalLands: number;
  manaBase: Record<string, number>; // color -> count
}

export interface CreaturePool {
  creatures: CardPoolItem[];
  totalCreatures: number;
  categoryBreakdown: Record<string, number>; // category -> count
}

export interface SpellPool {
  spells: CardPoolItem[];
  totalSpells: number;
  categoryBreakdown: Record<string, number>; // category -> count
}

export interface FinalDeck {
  commander: Card;
  lands: CardPoolItem[];
  creatures: CardPoolItem[];
  spells: CardPoolItem[];
  totalCards: number;
  manaCurve: Record<number, number>; // cmc -> count
  colorDistribution: Record<string, number>; // color -> count
}

// Pipeline progress events
export type DeckBuilderStage =
  | "processCommander"
  | "selectLands"
  | "pickCreatures"
  | "addSpells"
  | "optimizeCuts";

export interface StageStartEvent {
  type: "stageStarted";
  stage: DeckBuilderStage;
  message: string;
}

export interface StageFinishedEvent {
  type: "stageFinished";
  stage: DeckBuilderStage;
  result: CommanderPlan | LandPool | CreaturePool | SpellPool | FinalDeck;
  message: string;
}

export interface ProgressEvent {
  type: "progress";
  stage: DeckBuilderStage;
  progress: number; // 0-100
  message: string;
}

export interface ErrorEvent {
  type: "error";
  error: string;
}

export type DeckBuilderEvent =
  | StageStartEvent
  | StageFinishedEvent
  | ProgressEvent
  | ErrorEvent;

// Request/Response schemas
export const DeckBuilderRequestSchema = z.object({
  commanderId: z.string().uuid("Invalid commander ID format"),
  model: z.enum(["local", "remote"]).default("local"),
  options: z
    .object({
      budget: z.number().min(0).max(10000).optional(),
      powerLevel: z.number().min(1).max(10).default(7),
      includeCombo: z.boolean().default(true),
      focusTheme: z.string().max(100).optional(),
    })
    .optional(),
});

export const CardPoolRequestSchema = z.object({
  commanderId: z.string().uuid("Invalid commander ID format"),
});

export type DeckBuilderRequest = z.infer<typeof DeckBuilderRequestSchema>;
export type CardPoolRequest = z.infer<typeof CardPoolRequestSchema>;

// AI Provider interface
export interface AIProvider {
  isAvailable(): Promise<boolean>;
  generateCommanderPlan(
    commander: Card,
    cardPool: CardPoolItem[]
  ): Promise<CommanderPlan>;
  selectLands(plan: CommanderPlan, cardPool: CardPoolItem[]): Promise<LandPool>;
  pickCreatures(
    plan: CommanderPlan,
    lands: LandPool,
    cardPool: CardPoolItem[]
  ): Promise<CreaturePool>;
  addSpells(
    plan: CommanderPlan,
    lands: LandPool,
    creatures: CreaturePool,
    cardPool: CardPoolItem[]
  ): Promise<SpellPool>;
  optimizeCuts(
    plan: CommanderPlan,
    lands: LandPool,
    creatures: CreaturePool,
    spells: SpellPool,
    commander: Card
  ): Promise<FinalDeck>;
}
