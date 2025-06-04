// Based on Scryfall API documentation: https://scryfall.com/docs/api/cards

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
  artist_id?: string;
  cmc?: number;
  color_indicator?: string[];
  colors?: string[];
  flavor_text?: string;
  illustration_id?: string;
  image_uris?: ImageUris;
  layout?: string;
  loyalty?: string;
  mana_cost?: string;
  name: string;
  object: "card_face";
  oracle_id?: string;
  oracle_text?: string;
  power?: string;
  printed_name?: string;
  printed_text?: string;
  printed_type_line?: string;
  toughness?: string;
  type_line?: string;
  watermark?: string;
}

export interface RelatedCard {
  id: string;
  object: "related_card";
  component: "token" | "meld_part" | "meld_result" | "combo_piece";
  name: string;
  type_line: string;
  uri: string;
}

export interface Legalities {
  standard?: "legal" | "not_legal" | "restricted" | "banned";
  future?: "legal" | "not_legal" | "restricted" | "banned";
  historic?: "legal" | "not_legal" | "restricted" | "banned";
  timeless?: "legal" | "not_legal" | "restricted" | "banned";
  gladiator?: "legal" | "not_legal" | "restricted" | "banned";
  pioneer?: "legal" | "not_legal" | "restricted" | "banned";
  explorer?: "legal" | "not_legal" | "restricted" | "banned";
  modern?: "legal" | "not_legal" | "restricted" | "banned";
  legacy?: "legal" | "not_legal" | "restricted" | "banned";
  pauper?: "legal" | "not_legal" | "restricted" | "banned";
  vintage?: "legal" | "not_legal" | "restricted" | "banned";
  penny?: "legal" | "not_legal" | "restricted" | "banned";
  commander?: "legal" | "not_legal" | "restricted" | "banned";
  oathbreaker?: "legal" | "not_legal" | "restricted" | "banned";
  brawl?: "legal" | "not_legal" | "restricted" | "banned";
  historicbrawl?: "legal" | "not_legal" | "restricted" | "banned";
  alchemy?: "legal" | "not_legal" | "restricted" | "banned";
  paupercommander?: "legal" | "not_legal" | "restricted" | "banned";
  duel?: "legal" | "not_legal" | "restricted" | "banned";
  oldschool?: "legal" | "not_legal" | "restricted" | "banned";
  premodern?: "legal" | "not_legal" | "restricted" | "banned";
  predh?: "legal" | "not_legal" | "restricted" | "banned";
}

export interface Card {
  // Core fields
  id: string;
  object: "card";
  oracle_id?: string;
  multiverse_ids?: number[];
  mtgo_id?: number;
  mtgo_foil_id?: number;
  tcgplayer_id?: number;
  cardmarket_id?: number;
  arena_id?: number;

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
  color_indicator?: string[];

  // Legalities
  legalities: Legalities;

  // Multiface cards
  card_faces?: CardFace[];

  // Game data
  loyalty?: string;
  life_modifier?: string;
  hand_modifier?: string;

  // Related cards
  all_parts?: RelatedCard[];

  // Print data
  set: string;
  set_name: string;
  set_type: string;
  set_uri: string;
  set_search_uri: string;
  scryfall_set_uri: string;
  rulings_uri: string;
  prints_search_uri: string;
  collector_number: string;
  digital: boolean;
  rarity: "common" | "uncommon" | "rare" | "special" | "mythic" | "bonus";

  // Flavor
  flavor_text?: string;
  artist?: string;
  artist_ids?: string[];
  illustration_id?: string;
  border_color: "black" | "white" | "borderless" | "silver" | "gold";
  frame: string;
  frame_effects?: string[];
  security_stamp?: "oval" | "triangle" | "acorn" | "arena" | "heart";
  full_art: boolean;
  textless: boolean;
  booster: boolean;
  story_spotlight: boolean;

  // Pricing (nullable)
  prices?: {
    usd?: string;
    usd_foil?: string;
    usd_etched?: string;
    eur?: string;
    eur_foil?: string;
    tix?: string;
  };

  // Availability
  games: string[];
  reserved: boolean;
  foil: boolean;
  nonfoil: boolean;
  finishes: string[];
  oversized: boolean;
  promo: boolean;
  reprint: boolean;
  variation: boolean;

  // Watermarks
  watermark?: string;
  preview?: {
    source: string;
    source_uri: string;
    previewed_at: string;
  };
}

// API Response types
export interface ScryfallList<T> {
  object: "list";
  total_cards?: number;
  has_more: boolean;
  next_page?: string;
  data: T[];
  warnings?: string[];
}

export interface ScryfallError {
  object: "error";
  code: string;
  status: number;
  warnings?: string[];
  details: string;
}

export type ScryfallApiResponse<T> = T | ScryfallError;

export interface SearchParams {
  q: string;
  unique?: "cards" | "art" | "prints";
  order?:
    | "name"
    | "set"
    | "released"
    | "rarity"
    | "color"
    | "usd"
    | "tix"
    | "eur"
    | "cmc"
    | "power"
    | "toughness"
    | "edhrec"
    | "penny"
    | "artist"
    | "review";
  dir?: "auto" | "asc" | "desc";
  include_extras?: boolean;
  include_multilingual?: boolean;
  include_variations?: boolean;
  page?: number;
}
