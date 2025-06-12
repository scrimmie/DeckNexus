import type { Card } from "../types/scryfall";

const API_BASE_URL = import.meta.env.PROD
  ? "https://your-backend-domain.com"
  : "http://localhost:3001";

interface ApiResponse<T> {
  status: "success" | "error";
  data?: T;
  message?: string;
  errors?: Record<string, string[]>;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}

interface SearchCardsOptions {
  name?: string;
  type?: string;
  colors?: string;
  cmc?: string;
  commander?: boolean;
  page?: number;
  limit?: number;
}

class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public errors?: Record<string, string[]>
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export class DeckNexusApi {
  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;

    try {
      const response = await fetch(url, {
        headers: {
          "Content-Type": "application/json",
          ...options.headers,
        },
        ...options,
      });

      const data: ApiResponse<T> = await response.json();

      if (!response.ok || data.status === "error") {
        throw new ApiError(
          response.status,
          data.message || "An error occurred",
          data.errors
        );
      }

      return data.data as T;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }

      // Network or parsing error
      throw new ApiError(
        500,
        error instanceof Error ? error.message : "Network error occurred"
      );
    }
  }

  /**
   * Search for cards with various filters
   */
  async searchCards(options: SearchCardsOptions): Promise<{
    cards: Card[];
    hasMore: boolean;
    total?: number;
  }> {
    const searchParams = new URLSearchParams();

    Object.entries(options).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, String(value));
      }
    });

    const endpoint = `/api/v1/cards/search?${searchParams}`;
    const response = await this.makeRequest<Card[]>(endpoint);

    // The backend returns cards directly, but we need to match the expected interface
    // In a real implementation, you'd want to update the backend to return the full structure
    return {
      cards: Array.isArray(response) ? response : [],
      hasMore: false, // This would come from pagination info
      total: Array.isArray(response) ? response.length : 0,
    };
  }

  /**
   * Search for commanders by name
   */
  async searchCommanders(name: string): Promise<Card[]> {
    if (!name.trim()) {
      return [];
    }

    const searchParams = new URLSearchParams({ name: name.trim() });
    const endpoint = `/api/v1/cards/commanders/search?${searchParams}`;

    return this.makeRequest<Card[]>(endpoint);
  }

  /**
   * Get a card by its Scryfall ID
   */
  async getCardById(id: string): Promise<Card> {
    const endpoint = `/api/v1/cards/${id}`;
    return this.makeRequest<Card>(endpoint);
  }

  /**
   * Get a random card
   */
  async getRandomCard(): Promise<Card> {
    const endpoint = "/api/v1/cards/random";
    return this.makeRequest<Card>(endpoint);
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{ status: string; uptime: number }> {
    const endpoint = "/health";
    return this.makeRequest<{ status: string; uptime: number }>(endpoint);
  }
}

// Export singleton instance
export const deckNexusApi = new DeckNexusApi();
