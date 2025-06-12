const API_BASE_URL = "http://localhost:3001/api/v1";

export interface DeckBuilderProgress {
  type:
    | "connected"
    | "stageStarted"
    | "stageFinished"
    | "progress"
    | "error"
    | "complete";
  stage?: string;
  message?: string;
  progress?: number;
  result?: unknown;
  error?: string;
}

export interface DeckBuilderOptions {
  budget?: number;
  powerLevel?: number;
  includeCombo?: boolean;
  focusTheme?: string;
}

export interface DeckBuilderRequest {
  commanderId: string;
  model: "local" | "remote";
  options?: DeckBuilderOptions;
}

export interface CardPoolResponse {
  count: number;
}

class DeckBuilderAPI {
  /**
   * Get available AI models
   */
  async getAvailableModels(): Promise<string[]> {
    const response = await fetch(`${API_BASE_URL}/deckbuilder/models`);
    if (!response.ok) {
      throw new Error("Failed to fetch available models");
    }
    const data = await response.json();
    return data.data;
  }

  /**
   * Get the count of commander-legal cards for a given commander
   */
  async getCardPoolCount(commanderId: string): Promise<number> {
    const response = await fetch(`${API_BASE_URL}/cards/pool/${commanderId}`);
    if (!response.ok) {
      throw new Error("Failed to fetch card pool count");
    }
    const data = await response.json();
    return data.data.count;
  }

  /**
   * Start AI deck building with Server-Sent Events for progress updates
   */
  async buildDeck(
    request: DeckBuilderRequest,
    onProgress: (progress: DeckBuilderProgress) => void
  ): Promise<void> {
    // Note: EventSource doesn't support POST requests directly in most browsers
    // We'll use fetch with streaming instead
    return this.buildDeckWithFetch(request, onProgress);
  }

  /**
   * Alternative implementation using fetch for POST requests with streaming
   */
  private async buildDeckWithFetch(
    request: DeckBuilderRequest,
    onProgress: (progress: DeckBuilderProgress) => void
  ): Promise<void> {
    console.log("Building deck with fetch");
    console.log(request);
    const response = await fetch(`${API_BASE_URL}/deckbuilder/build`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error("No response body reader available");
    }

    const decoder = new TextDecoder();
    let buffer = "";

    try {
      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Process complete lines
        const lines = buffer.split("\n");
        buffer = lines.pop() || ""; // Keep incomplete line in buffer

        for (const line of lines) {
          if (line.trim() === "") continue;

          if (line.startsWith("data: ")) {
            try {
              const jsonData = line.slice(6); // Remove 'data: ' prefix
              const progressData = JSON.parse(jsonData) as DeckBuilderProgress;
              onProgress(progressData);

              if (
                progressData.type === "complete" ||
                progressData.type === "error"
              ) {
                return;
              }
            } catch (parseError) {
              console.warn("Failed to parse SSE data:", line, parseError);
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }
}

export const deckBuilderAPI = new DeckBuilderAPI();
