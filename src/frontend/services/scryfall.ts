import type {
  Card,
  ScryfallList,
  ScryfallError,
  ScryfallApiResponse,
  SearchParams,
} from "@/types/scryfall";

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

export class ScryfallClient {
  private readonly baseUrl = "https://api.scryfall.com";
  private readonly rateLimiter = new RateLimiter();
  private readonly userAgent = "DeckNexus/1.0";

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
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
    options: RequestInit,
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
        throw new Error(`Rate limit exceeded after ${MAX_RETRIES} retries`);
      }

      // Handle other HTTP errors
      if (!response.ok) {
        const error = data as ScryfallError;
        throw new Error(
          `Scryfall API error: ${error.details || response.statusText}`
        );
      }

      return data as T;
    } catch (error) {
      if (error instanceof TypeError && error.message.includes("fetch")) {
        // Network error - retry if we haven't exceeded max retries
        if (retryCount < MAX_RETRIES) {
          const retryDelay = INITIAL_RETRY_DELAY * Math.pow(2, retryCount);
          await this.delay(retryDelay);
          return this.requestWithRetry<T>(url, options, retryCount + 1);
        }
      }
      throw error;
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
   * Search for cards using Scryfall's search syntax
   * https://scryfall.com/docs/api/cards/search
   */
  private async searchCards(params: SearchParams): Promise<Card[]> {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, String(value));
      }
    });

    const response = await this.makeRequest<ScryfallList<Card>>(
      `/cards/search?${searchParams}`
    );

    if (this.isError(response)) {
      throw new Error(response.details);
    }

    return response.data;
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
   * Search for commanders by name using fuzzy matching
   */
  async searchCommandersByName(name: string): Promise<Card[]> {
    if (!name.trim()) return [];

    try {
      // Search for legendary creatures and planeswalkers that can be commanders
      // Using fuzzy search and commander-specific filters
      const query = `name:${name.trim()} (type:legendary type:creature OR (type:planeswalker oracle:"can be your commander"))`;

      const cards = await this.searchCards({
        q: query,
        unique: "cards",
        order: "name",
      });

      // Filter to only valid commanders and sort by name similarity
      const validCommanders = cards.filter((card) =>
        this.isValidCommander(card)
      );

      // Sort by name similarity (exact matches first, then partial matches)
      const searchTerm = name.toLowerCase().trim();
      return validCommanders.sort((a, b) => {
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
      console.error("Error searching commanders:", error);
      throw new Error("Failed to search for commanders. Please try again.");
    }
  }
}

// Export singleton instance
export const scryfallClient = new ScryfallClient();
