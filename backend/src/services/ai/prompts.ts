import type {
  CommanderPlan,
  LandPool,
  CreaturePool,
} from "@/types/deckbuilder";
import type { Card } from "@/types/scryfall";

export const COMMANDER_CONTEXT = `
You are a highly skilled Magic: The Gathering deck building expert with deep knowledge of Commander format strategy.

COMMANDER DECK BUILDING CONTEXT:
A well-balanced Commander (EDH) deck typically consists of 100 cards (including the commander), and its composition often follows this general guideline:

### 1. **Lands (~35–38 cards)**
* Basic lands (Forests, Islands, Mountains, etc.)
* Dual lands, fetch lands, utility lands, and mana-fixing lands.

### 2. **Ramp & Mana Fixing (~8–12 cards)**
* Artifact mana (Sol Ring, Arcane Signet, Mana Crypt)
* Land ramp (Cultivate, Rampant Growth, Farseek)
* Mana rocks specific to your colors (Signets, Talismans)

### 3. **Card Draw & Card Advantage (~8–12 cards)**
* Continuous draw effects (Rhystic Study, Mystic Remora, Phyrexian Arena)
* One-time powerful draw spells (Harmonize, Fact or Fiction, Night's Whisper)
* Card advantage through recursion or synergy (Eternal Witness, Sun Titan, Archaeomancer)

### 4. **Interaction & Removal (~8–12 cards)**
* Targeted removal (Swords to Plowshares, Beast Within, Assassin's Trophy)
* Mass removal (Wrath of God, Cyclonic Rift, Blasphemous Act)
* Counterspells or defensive interactions (Counterspell, Heroic Intervention)

### 5. **Win Conditions (~5–8 cards)**
* Cards that directly enable your victory (Craterhoof Behemoth, Exsanguinate)
* Strong synergistic combinations aligned with your commander's strategy
* Reliable game finishers or overwhelming board presence creators

### 6. **Utility & Support (~8–12 cards)**
* Cards that synergize specifically with your commander's strategy
* Tutors to reliably find key pieces (Demonic Tutor, Enlightened Tutor)
* Graveyard recursion, protection, or key enchantments/artifacts that enhance your game plan

### 7. **Commander Synergy & Theme (~15–20 cards)**
* Cards specifically chosen to enhance and synergize with your commander's unique abilities or your deck's chosen strategy.
`;

export const getCommanderPlanPrompt = (
  commander: Card,
  cardPoolSize: number
): string => `
${COMMANDER_CONTEXT}

Now analyze this commander and create a comprehensive strategic plan with RANKED strategies based on these deck building principles:

Commander: ${commander.name}
Type: ${commander.type_line}
Mana Cost: ${commander.mana_cost}
Oracle Text: ${commander.oracle_text}
Colors: ${commander.color_identity?.join(", ")}
Power/Toughness: ${commander.power}/${commander.toughness}

Available card pool: ${cardPoolSize} commander-legal cards

Create a strategic plan with 3 ranked strategies (1 = best, 3 = backup). For each strategy:
1. Analyze the commander's unique abilities and how to leverage them
2. Identify specific win conditions and game plans
3. Determine optimal archetypes and play patterns
4. List key themes and card types to prioritize

The #1 ranked strategy will be used for all subsequent card selections.

Respond with valid JSON only:
{
  "rankedStrategies": [
    {
      "rank": 1,
      "name": "Strategy Name",
      "description": "Detailed description of how this strategy works",
      "winConditions": ["primary win con", "secondary win con"],
      "archetypes": ["primary archetype", "secondary archetype"],
      "keyThemes": ["theme1", "theme2", "theme3"]
    },
    {
      "rank": 2,
      "name": "Alternative Strategy",
      "description": "Alternative approach description",
      "winConditions": ["alt win con 1", "alt win con 2"],
      "archetypes": ["archetype"],
      "keyThemes": ["theme1", "theme2"]
    },
    {
      "rank": 3,
      "name": "Backup Strategy", 
      "description": "Backup approach description",
      "winConditions": ["backup win con"],
      "archetypes": ["archetype"],
      "keyThemes": ["theme"]
    }
  ]
}
`;

export const getLandBatchPrompt = (
  batch: any[],
  plan: CommanderPlan,
  type: "basic" | "non-basic",
  batchIndex: number,
  totalBatches: number,
  candidatesPerBatch: number
): string => `
You are a MTG deck building expert. Evaluate this batch of ${type} lands for Commander deck construction.

PRIMARY STRATEGY: ${plan.primaryStrategy.name}
Description: ${plan.primaryStrategy.description}
Win Conditions: ${plan.primaryStrategy.winConditions.join(", ")}
Key Themes: ${plan.primaryStrategy.keyThemes.join(", ")}

LAND EVALUATION PRINCIPLES:
${
  type === "basic"
    ? "- Basic lands provide reliable mana fixing\n- Consider color requirements of strategy\n- Include basics that support the color identity"
    : "- Prioritize utility and mana fixing\n- Look for lands that advance strategy\n- Consider speed vs utility trade-offs\n- Value lands with multiple abilities"
}

AVAILABLE ${type.toUpperCase()} LANDS (Batch ${batchIndex + 1}/${totalBatches}):
${batch
  .map(
    (land) =>
      `- ${land.name} | ${land.mana_cost || "No cost"} | ${land.type_line}${
        land.edhrec_rank ? ` | EDHRank: ${land.edhrec_rank}` : ""
      }\n  Oracle: "${land.oracle_text}"`
  )
  .join("\n")}

Select the top ${candidatesPerBatch} lands from this batch that best support the PRIMARY STRATEGY. If you feel that the batch does not include any lands that support the strategy, select none.

Respond with JSON only:
{
  "selectedLands": [
    {"name": "land name", "reason": "why this land supports the strategy"}
  ],
  "batchReasoning": "why these lands were chosen from this batch"
}
`;

export const getFinalLandSelectionPrompt = (
  basicCandidates: any[],
  nonBasicCandidates: any[],
  plan: CommanderPlan
): string => `
You are a MTG deck building expert. Create the optimal 35-37 land mana base from these pre-screened candidates.

PRIMARY STRATEGY: ${plan.primaryStrategy.name}
Description: ${plan.primaryStrategy.description}
Win Conditions: ${plan.primaryStrategy.winConditions.join(", ")}
Key Themes: ${plan.primaryStrategy.keyThemes.join(", ")}

LAND BASE PRINCIPLES:
- Commander decks need 35-38 lands for consistency
- Balance basic lands with utility lands
- Ensure proper color fixing for strategy
- Include lands that advance your win conditions

BASIC LAND CANDIDATES (${basicCandidates.length}):
${basicCandidates
  .map(
    (land) =>
      `- ${land.name} | ${land.type_line}${
        land.edhrec_rank ? ` | EDHRank: ${land.edhrec_rank}` : ""
      }`
  )
  .join("\n")}

NON-BASIC LAND CANDIDATES (${nonBasicCandidates.length}):
${nonBasicCandidates
  .map(
    (land) =>
      `- ${land.name} | ${land.type_line}${
        land.edhrec_rank ? ` | EDHRank: ${land.edhrec_rank}` : ""
      }\n  Oracle: "${land.oracle_text.substring(0, 100)}..."`
  )
  .join("\n")}

Select exactly 35-37 lands total. Balance basics for consistency with utility lands for strategy.

Respond with JSON only:
{
  "selectedBasics": [
    {"name": "land name", "count": number, "reason": "why included"}
  ],
  "selectedNonBasics": [
    {"name": "land name", "reason": "strategic value"}
  ],
  "totalCount": number,
  "strategicReasoning": "overall mana base strategy"
}
`;

export const getCreatureBatchPrompt = (
  batch: any[],
  plan: CommanderPlan,
  lands: LandPool,
  batchIndex: number,
  totalBatches: number,
  candidatesPerBatch: number,
  extractCMC: (manaCost: string) => number
): string => `
You are a MTG deck building expert. Evaluate this batch of creatures for Commander deck construction.

PRIMARY STRATEGY: ${plan.primaryStrategy.name}
Description: ${plan.primaryStrategy.description}
Win Conditions: ${plan.primaryStrategy.winConditions.join(", ")}
Key Themes: ${plan.primaryStrategy.keyThemes.join(", ")}

Mana Base: ${lands.totalLands} lands
Color Distribution: ${Object.entries(lands.manaBase)
  .map(([color, count]) => `${color}: ${count}`)
  .join(", ")}

CREATURE EVALUATION PRINCIPLES:
- Prioritize creatures that advance your primary strategy
- Look for ETB effects, ongoing value, and synergies
- Consider mana curve distribution
- Value creatures that protect your commander
- Include utility creatures for card advantage

AVAILABLE CREATURES (Batch ${batchIndex + 1}/${totalBatches}):
${batch
  .map((creature) => {
    const cmc = extractCMC(creature.mana_cost);
    const powerToughness =
      creature.power && creature.toughness
        ? ` [${creature.power}/${creature.toughness}]`
        : "";
    return `- ${creature.name} | ${
      creature.mana_cost || "No cost"
    } | CMC ${cmc} | ${creature.type_line}${powerToughness}${
      creature.edhrec_rank ? ` | EDHRank: ${creature.edhrec_rank}` : ""
    }\n  Oracle: "${creature.oracle_text}"`;
  })
  .join("\n")}

Select the top ${candidatesPerBatch} creatures from this batch that best support the PRIMARY STRATEGY. If you feel that the batch does not include any creatures that support the strategy, select none.

Respond with JSON only:
{
  "selectedCreatures": [
    {
      "name": "creature name",
      "category": "Early Game|Mid Game|Late Game|Utility",
      "strategicRole": "how this creature enables the primary strategy"
    }
  ],
  "batchReasoning": "why these creatures were chosen from this batch"
}
`;

export const getFinalCreatureSelectionPrompt = (
  creatureCandidates: any[],
  plan: CommanderPlan,
  lands: LandPool,
  targetCount: number,
  extractCMC: (manaCost: string) => number
): string => `
You are a MTG deck building expert. Create the optimal creature suite from these pre-screened candidates.

PRIMARY STRATEGY: ${plan.primaryStrategy.name}
Description: ${plan.primaryStrategy.description}
Win Conditions: ${plan.primaryStrategy.winConditions.join(", ")}
Key Themes: ${plan.primaryStrategy.keyThemes.join(", ")}

Mana Base: ${lands.totalLands} lands
Color Distribution: ${Object.entries(lands.manaBase)
  .map(([color, count]) => `${color}: ${count}`)
  .join(", ")}

CREATURE SELECTION PRINCIPLES:
- Commander decks typically run 25-30 creatures
- Balance mana curve (low/mid/high cost)
- Include utility creatures for card advantage
- Prioritize creatures that enable win conditions
- Ensure color requirements match mana base

CREATURE CANDIDATES (${creatureCandidates.length}):
${creatureCandidates
  .map((creature) => {
    const cmc = extractCMC(creature.mana_cost);
    const powerToughness =
      creature.power && creature.toughness
        ? ` [${creature.power}/${creature.toughness}]`
        : "";
    return `- ${creature.name} | ${
      creature.mana_cost || "No cost"
    } | CMC ${cmc} | ${creature.type_line}${powerToughness}${
      creature.edhrec_rank ? ` | EDHRank: ${creature.edhrec_rank}` : ""
    }\n  Oracle: "${creature.oracle_text.substring(0, 100)}..."`;
  })
  .join("\n")}

Select exactly ${targetCount} creatures that best execute the PRIMARY STRATEGY.

Respond with JSON only:
{
  "selectedCreatures": [
    {
      "name": "creature name",
      "category": "Early Game|Mid Game|Late Game|Utility",
      "strategicRole": "how this creature enables the primary strategy"
    }
  ],
  "totalCount": ${targetCount},
  "strategicReasoning": "overall creature suite strategy"
}
`;

export const getSpellBatchPrompt = (
  batch: any[],
  plan: CommanderPlan,
  lands: LandPool,
  creatures: CreaturePool,
  batchIndex: number,
  totalBatches: number,
  candidatesPerBatch: number,
  extractCMC: (manaCost: string) => number
): string => `
You are a MTG deck building expert. Evaluate this batch of spells for Commander deck construction.

PRIMARY STRATEGY: ${plan.primaryStrategy.name}
Description: ${plan.primaryStrategy.description}
Win Conditions: ${plan.primaryStrategy.winConditions.join(", ")}
Key Themes: ${plan.primaryStrategy.keyThemes.join(", ")}

Current deck:
- Lands: ${lands.totalLands}
- Creatures: ${creatures.totalCreatures}

SPELL EVALUATION PRINCIPLES:
- Balance removal, card draw, ramp, and protection
- Prioritize spells that advance your strategy
- Include interaction for threats
- Value spells that protect key pieces
- Look for card advantage engines

AVAILABLE SPELLS (Batch ${batchIndex + 1}/${totalBatches}):
${batch
  .map((spell) => {
    const cmc = extractCMC(spell.mana_cost);
    return `- ${spell.name} | ${spell.mana_cost || "No cost"} | CMC ${cmc} | ${
      spell.type_line
    }${
      spell.edhrec_rank ? ` | EDHRank: ${spell.edhrec_rank}` : ""
    }\n  Oracle: "${spell.oracle_text}"`;
  })
  .join("\n")}

Select the top ${candidatesPerBatch} spells from this batch that best support the PRIMARY STRATEGY. If you feel that the batch does not include any spells that support the strategy, select none.

Respond with JSON only:
{
  "selectedSpells": [
    {
      "name": "spell name",
      "category": "Removal|Card Draw|Ramp|Protection|Win Condition|Utility",
      "strategicRole": "how this spell supports the primary strategy"
    }
  ],
  "batchReasoning": "why these spells were chosen from this batch"
}
`;

export const getFinalSpellSelectionPrompt = (
  spellCandidates: any[],
  plan: CommanderPlan,
  lands: LandPool,
  creatures: CreaturePool,
  remainingSlots: number,
  extractCMC: (manaCost: string) => number
): string => `
You are a MTG deck building expert. Create the optimal spell suite from these pre-screened candidates.

PRIMARY STRATEGY: ${plan.primaryStrategy.name}
Description: ${plan.primaryStrategy.description}
Win Conditions: ${plan.primaryStrategy.winConditions.join(", ")}
Key Themes: ${plan.primaryStrategy.keyThemes.join(", ")}

Current deck:
- Lands: ${lands.totalLands}
- Creatures: ${creatures.totalCreatures}
- Remaining slots for spells: ${remainingSlots}

SPELL SELECTION PRINCIPLES:
- Balance removal, card draw, ramp, and protection
- Include 8-12 removal spells for interaction
- Add 8-12 card advantage sources
- Include ramp if needed for strategy
- Add protection for key pieces
- Include win condition enablers

SPELL CANDIDATES (${spellCandidates.length}):
${spellCandidates
  .map((spell) => {
    const cmc = extractCMC(spell.mana_cost);
    return `- ${spell.name} | ${spell.mana_cost || "No cost"} | CMC ${cmc} | ${
      spell.type_line
    }${
      spell.edhrec_rank ? ` | EDHRank: ${spell.edhrec_rank}` : ""
    }\n  Oracle: "${spell.oracle_text.substring(0, 100)}..."`;
  })
  .join("\n")}

Select exactly ${remainingSlots} spells that best support the PRIMARY STRATEGY.

Respond with JSON only:
{
  "selectedSpells": [
    {
      "name": "spell name",
      "category": "Removal|Card Draw|Ramp|Protection|Win Condition|Utility",
      "strategicRole": "how this spell supports the primary strategy"
    }
  ],
  "totalCount": ${remainingSlots},
  "strategicReasoning": "overall spell suite strategy"
}
`;

export const getOptimizeCutsPrompt = (
  plan: CommanderPlan,
  lands: any[],
  creatures: any[],
  spells: any[],
  totalNonCommander: number,
  excess: number,
  extractCMC: (manaCost: string) => number
): string => `
You are a MTG deck building expert. Optimize this deck by making exactly ${excess} strategic cuts to reach 99 cards.

PRIMARY STRATEGY: ${plan.primaryStrategy.name}
Description: ${plan.primaryStrategy.description}
Win Conditions: ${plan.primaryStrategy.winConditions.join(", ")}
Key Themes: ${plan.primaryStrategy.keyThemes.join(", ")}

CURRENT DECK COMPOSITION (${totalNonCommander} cards, need to cut ${excess}):

LANDS (${lands.length} cards):
${lands
  .slice(0, 50)
  .map(
    (land) =>
      `- ${land.name} | ${land.mana_cost || "No cost"} | ${land.type_line}`
  )
  .join("\n")}${
  lands.length > 50 ? `\n...and ${lands.length - 50} more lands` : ""
}

CREATURES (${creatures.length} cards):
${creatures
  .slice(0, 75)
  .map((creature) => {
    const cmc = extractCMC(creature.mana_cost);
    const powerToughness =
      creature.power && creature.toughness
        ? ` [${creature.power}/${creature.toughness}]`
        : "";
    return `- ${creature.name} | ${
      creature.mana_cost || "No cost"
    } | CMC ${cmc} | ${creature.type_line}${powerToughness}`;
  })
  .join("\n")}${
  creatures.length > 75
    ? `\n...and ${creatures.length - 75} more creatures`
    : ""
}

SPELLS (${spells.length} cards):
${spells
  .slice(0, 100)
  .map((spell) => {
    const cmc = extractCMC(spell.mana_cost);
    return `- ${spell.name} | ${spell.mana_cost || "No cost"} | CMC ${cmc} | ${
      spell.type_line
    }`;
  })
  .join("\n")}${
  spells.length > 100 ? `\n...and ${spells.length - 100} more spells` : ""
}

Make strategic cuts that:
1. Remove cards least essential to the PRIMARY STRATEGY
2. Eliminate redundant effects 
3. Cut high-cost, low-impact cards
4. Maintain mana curve balance
5. Preserve key synergies and win conditions

Respond with JSON only:
{
  "cutsToMake": [
    {
      "cardName": "card to cut",
      "cardType": "Land|Creature|Spell", 
      "reason": "why this card should be cut"
    }
  ],
  "totalCuts": ${excess},
  "optimizationReasoning": "overall strategy for these cuts"
}
`;
