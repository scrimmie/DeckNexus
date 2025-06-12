import fetch from "node-fetch";
import type {
  Card,
  ScryfallList,
  ScryfallError,
  ScryfallApiResponse,
  SearchParams,
} from "@/types/scryfall";
import { ExternalServiceError } from "@/types/api";

// Rate limiting configuration based on Scryfall guidelines
// https://scryfall.com/docs/api - recommends 50-100ms delay (10 req/sec)
const RATE_LIMIT_DELAY = 100; // milliseconds
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000; // 1 second

class RateLimiter {
  private lastRequestTime = 0;
  private requestQueue: Array<() => void> = [];
  private isProcessing = false;

  async throttle<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.requestQueue.push(async () => {
        try {
          const result = await fn();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });

      if (!this.isProcessing) {
        this.processQueue();
      }
    });
  }

  private async processQueue(): Promise<void> {
    if (this.requestQueue.length === 0) {
      this.isProcessing = false;
      return;
    }

    this.isProcessing = true;
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;

    if (timeSinceLastRequest < RATE_LIMIT_DELAY) {
      await this.delay(RATE_LIMIT_DELAY - timeSinceLastRequest);
    }

    const nextRequest = this.requestQueue.shift();
    if (nextRequest) {
      this.lastRequestTime = Date.now();
      await nextRequest();
    }

    // Continue processing queue
    setTimeout(() => this.processQueue(), 0);
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export class ScryfallService {
  private readonly baseUrl = "https://api.scryfall.com";
  private readonly rateLimiter = new RateLimiter();
  private readonly userAgent = "DeckNexus-API/1.0";

  private async makeRequest<T>(
    endpoint: string,
    options: any = {}
  ): Promise<ScryfallApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;

    const headers = {
      "User-Agent": this.userAgent,
      Accept: "application/json",
      ...options.headers,
    };

    return this.rateLimiter.throttle(async () => {
      return this.requestWithRetry<T>(url, { ...options, headers });
    });
  }

  private async requestWithRetry<T>(
    url: string,
    options: any,
    retryCount = 0
  ): Promise<ScryfallApiResponse<T>> {
    try {
      const response = await fetch(url, options);
      const data = await response.json();

      // Handle rate limiting with exponential backoff
      if (response.status === 429) {
        if (retryCount < MAX_RETRIES) {
          const retryDelay = INITIAL_RETRY_DELAY * Math.pow(2, retryCount);
          await this.delay(retryDelay);
          return this.requestWithRetry<T>(url, options, retryCount + 1);
        }
        throw new ExternalServiceError(
          "Scryfall",
          `Rate limit exceeded after ${MAX_RETRIES} retries`
        );
      }

      // Handle other HTTP errors
      if (!response.ok) {
        const error = data as ScryfallError;
        throw new ExternalServiceError(
          "Scryfall",
          error.details || response.statusText
        );
      }

      return data as T;
    } catch (error) {
      if (error instanceof ExternalServiceError) {
        throw error;
      }

      if (error instanceof Error && error.message.includes("fetch")) {
        // Network error - retry if we haven't exceeded max retries
        if (retryCount < MAX_RETRIES) {
          const retryDelay = INITIAL_RETRY_DELAY * Math.pow(2, retryCount);
          await this.delay(retryDelay);
          return this.requestWithRetry<T>(url, options, retryCount + 1);
        }
      }
      throw new ExternalServiceError("Scryfall", "Network error");
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private isError(
    response: ScryfallApiResponse<unknown>
  ): response is ScryfallError {
    return (
      response !== null &&
      typeof response === "object" &&
      "object" in response &&
      (response as { object: string }).object === "error"
    );
  }

  /**
   * Get a card by its Scryfall ID
   */
  async getCardById(id: string): Promise<Card> {
    const response = await this.makeRequest<Card>(`/cards/${id}`);

    if (this.isError(response)) {
      throw new ExternalServiceError("Scryfall", response.details);
    }

    return response;
  }

  /**
   * Get a random card
   */
  async getRandomCard(): Promise<Card> {
    const response = await this.makeRequest<Card>("/cards/random");

    if (this.isError(response)) {
      throw new ExternalServiceError("Scryfall", response.details);
    }

    return response;
  }

  /**
   * Check if a card can be a commander
   */
  private isValidCommander(card: Card): boolean {
    // Legendary creatures can be commanders
    if (
      card.type_line?.includes("Legendary") &&
      card.type_line?.includes("Creature")
    ) {
      return true;
    }

    // Some planeswalkers can be commanders (those with "can be your commander" text)
    if (card.type_line?.includes("Planeswalker")) {
      const oracleText = card.oracle_text || "";
      const canBeCommander = oracleText
        .toLowerCase()
        .includes("can be your commander");
      return canBeCommander;
    }

    // Check card faces for multiface cards
    if (card.card_faces) {
      return card.card_faces.some((face) => {
        const isLegendaryCreature =
          face.type_line?.includes("Legendary") &&
          face.type_line?.includes("Creature");

        const isPlaneswalkerCommander =
          face.type_line?.includes("Planeswalker") &&
          face.oracle_text?.toLowerCase().includes("can be your commander");

        return isLegendaryCreature || isPlaneswalkerCommander;
      });
    }

    return false;
  }

  /**
   * Build a Scryfall query from search parameters
   */
  private buildSearchQuery(params: {
    name?: string;
    type?: string;
    colors?: string;
    cmc?: string;
    commander?: boolean;
  }): string {
    const queryParts: string[] = [];

    if (params.name) {
      queryParts.push(`name:"${params.name}"`);
    }

    if (params.type) {
      queryParts.push(`type:${params.type}`);
    }

    if (params.colors) {
      queryParts.push(`colors:${params.colors}`);
    }

    if (params.cmc) {
      queryParts.push(`cmc:${params.cmc}`);
    }

    if (params.commander) {
      queryParts.push(
        '(type:legendary type:creature OR (type:planeswalker oracle:"can be your commander"))'
      );
    }

    return queryParts.join(" ");
  }

  /**
   * Search for cards with various filters
   */
  async searchCards(params: {
    name?: string;
    type?: string;
    colors?: string;
    cmc?: string;
    commander?: boolean;
    page?: number;
    limit?: number;
  }): Promise<{ cards: Card[]; hasMore: boolean; total?: number }> {
    if (
      !params.name &&
      !params.type &&
      !params.colors &&
      !params.cmc &&
      !params.commander
    ) {
      throw new Error("At least one search parameter is required");
    }

    try {
      const query = this.buildSearchQuery(params);

      const searchParams: SearchParams = {
        q: query,
        unique: "cards",
        order: "name",
        page: params.page || 1,
      };

      const response = await this.makeRequest<ScryfallList<Card>>(
        `/cards/search?${new URLSearchParams(
          Object.entries(searchParams).map(([k, v]) => [k, String(v)])
        )}`
      );

      if (this.isError(response)) {
        throw new ExternalServiceError("Scryfall", response.details);
      }

      // Filter for commanders if requested
      let cards = response.data;
      if (params.commander) {
        cards = cards.filter((card) => this.isValidCommander(card));
      }

      // Apply pagination if limit is specified
      const limit = params.limit || cards.length;
      const startIndex = ((params.page || 1) - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedCards = cards.slice(startIndex, endIndex);

      return {
        cards: paginatedCards,
        hasMore: response.has_more || endIndex < cards.length,
        total: response.total_cards,
      };
    } catch (error) {
      if (error instanceof ExternalServiceError) {
        throw error;
      }
      throw new ExternalServiceError(
        "Scryfall",
        "Failed to search for cards. Please try again."
      );
    }
  }

  /**
   * Search for commanders by name using fuzzy matching
   */
  async searchCommanders(name: string): Promise<Card[]> {
    if (!name.trim()) {
      return [];
    }

    try {
      const result = await this.searchCards({
        name: name.trim(),
        commander: true,
      });

      // Sort by name similarity (exact matches first, then partial matches)
      const searchTerm = name.toLowerCase().trim();
      return result.cards.sort((a, b) => {
        const aName = a.name.toLowerCase();
        const bName = b.name.toLowerCase();

        // Exact matches first
        if (aName === searchTerm && bName !== searchTerm) return -1;
        if (bName === searchTerm && aName !== searchTerm) return 1;

        // Then starts with matches
        if (aName.startsWith(searchTerm) && !bName.startsWith(searchTerm))
          return -1;
        if (bName.startsWith(searchTerm) && !aName.startsWith(searchTerm))
          return 1;

        // Finally alphabetical
        return aName.localeCompare(bName);
      });
    } catch (error) {
      if (error instanceof ExternalServiceError) {
        throw error;
      }
      throw new ExternalServiceError(
        "Scryfall",
        "Failed to search for commanders. Please try again."
      );
    }
  }

  /**
   * Raw search using a Scryfall query string
   */
  async rawSearch(
    query: string,
    page: number = 1
  ): Promise<{ cards: Card[]; hasMore: boolean; total?: number }> {
    try {
      const searchParams: SearchParams = {
        q: query,
        unique: "cards",
        order: "name",
        page,
      };

      const response = await this.makeRequest<ScryfallList<Card>>(
        `/cards/search?${new URLSearchParams(
          Object.entries(searchParams).map(([k, v]) => [k, String(v)])
        )}`
      );

      if (this.isError(response)) {
        throw new ExternalServiceError("Scryfall", response.details);
      }

      return {
        cards: response.data,
        hasMore: response.has_more || false,
        total: response.total_cards,
      };
    } catch (error) {
      if (error instanceof ExternalServiceError) {
        throw error;
      }
      throw new ExternalServiceError(
        "Scryfall",
        "Failed to search for cards. Please try again."
      );
    }
  }
}

// Export singleton instance
export const scryfallService = new ScryfallService();
