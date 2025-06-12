// Simplified Scryfall types for frontend - matches backend types

export interface ImageUris {
  small?: string;
  normal?: string;
  large?: string;
  png?: string;
  art_crop?: string;
  border_crop?: string;
}

export interface CardFace {
  artist?: string;
  cmc?: number;
  colors?: string[];
  flavor_text?: string;
  image_uris?: ImageUris;
  loyalty?: string;
  mana_cost?: string;
  name: string;
  object: "card_face";
  oracle_text?: string;
  power?: string;
  toughness?: string;
  type_line?: string;
}

export interface Legalities {
  standard?: "legal" | "not_legal" | "restricted" | "banned";
  future?: "legal" | "not_legal" | "restricted" | "banned";
  historic?: "legal" | "not_legal" | "restricted" | "banned";
  pioneer?: "legal" | "not_legal" | "restricted" | "banned";
  modern?: "legal" | "not_legal" | "restricted" | "banned";
  legacy?: "legal" | "not_legal" | "restricted" | "banned";
  pauper?: "legal" | "not_legal" | "restricted" | "banned";
  vintage?: "legal" | "not_legal" | "restricted" | "banned";
  commander?: "legal" | "not_legal" | "restricted" | "banned";
  oathbreaker?: "legal" | "not_legal" | "restricted" | "banned";
  brawl?: "legal" | "not_legal" | "restricted" | "banned";
}

export interface Card {
  // Core fields
  id: string;
  object: "card";
  oracle_id?: string;
  multiverse_ids?: number[];

  // Print details
  name: string;
  lang: string;
  released_at: string;
  uri: string;
  scryfall_uri: string;
  layout: string;

  // Imagery
  image_uris?: ImageUris;
  mana_cost?: string;
  cmc?: number;
  type_line?: string;
  oracle_text?: string;
  power?: string;
  toughness?: string;
  colors?: string[];
  color_identity?: string[];

  // Legalities
  legalities: Legalities;

  // Multiface cards
  card_faces?: CardFace[];

  // Game data
  loyalty?: string;

  // Print data
  set: string;
  set_name: string;
  set_type: string;
  collector_number: string;
  digital: boolean;
  rarity: "common" | "uncommon" | "rare" | "special" | "mythic" | "bonus";

  // Flavor
  flavor_text?: string;
  artist?: string;
  border_color: "black" | "white" | "borderless" | "silver" | "gold";
  frame: string;
  full_art: boolean;
  textless: boolean;

  // Pricing
  prices?: {
    usd?: string;
    usd_foil?: string;
    eur?: string;
    eur_foil?: string;
  };

  // Availability
  games: string[];
  reserved: boolean;
  foil: boolean;
  nonfoil: boolean;
  oversized: boolean;
  promo: boolean;
  reprint: boolean;
}
