 import type { AIProvider } from "@/types/deckbuilder";
import { LocalAIProvider } from "./local.provider";
import { RemoteAIProvider } from "./remote.provider";
import config from "@/config/config";

export class AIProviderFactory {
  static createProvider(providerType?: "local" | "remote"): AIProvider {
    const type = providerType || config.ai?.defaultProvider || "local";

    switch (type) {
      case "local":
        return new LocalAIProvider(config.ai?.local);

      case "remote":
        if (!config.ai?.remote?.apiKey) {
          console.warn(
            "Remote AI provider requested but no API key configured, falling back to local"
          );
          return new LocalAIProvider(config.ai?.local);
        }
        return new RemoteAIProvider(
          config.ai.remote as {
            apiKey: string;
            baseUrl?: string;
            model?: string;
          }
        );

      default:
        throw new Error(`Unknown AI provider type: ${type}`);
    }
  }

  /**
   * Validate that the requested provider is available
   */
  static async validateProvider(
    providerType?: "local" | "remote"
  ): Promise<{ available: boolean; provider: AIProvider; message?: string }> {
    const type = providerType || config.ai?.defaultProvider || "local";
    console.log(`🏭 AIProviderFactory: Validating provider type: ${type}`);

    if (type === "remote" && !config.ai?.remote?.apiKey) {
      // Remote requested but no API key - fall back to local
      const localProvider = new LocalAIProvider(config.ai?.local);
      const localAvailable = await localProvider.isAvailable();

      if (!localAvailable) {
        return {
          available: false,
          provider: localProvider,
          message:
            "Remote AI provider requested but no API key configured, and local AI service (LM Studio) is not running",
        };
      }

      return {
        available: true,
        provider: localProvider,
        message:
          "Remote AI provider requested but no API key configured, falling back to local AI",
      };
    }

    if (type === "local") {
      const localProvider = new LocalAIProvider(config.ai?.local);
      const localAvailable = await localProvider.isAvailable();

      if (!localAvailable) {
        return {
          available: false,
          provider: localProvider,
          message:
            "Local AI service (LM Studio) is not running on " +
            (config.ai?.local?.baseUrl || "http://localhost:1234"),
        };
      }

      return {
        available: true,
        provider: localProvider,
        message: "Local AI service available",
      };
    }

    if (type === "remote") {
      const remoteProvider = new RemoteAIProvider(
        config.ai!.remote as {
          apiKey: string;
          baseUrl?: string;
          model?: string;
        }
      );

      return {
        available: true,
        provider: remoteProvider,
        message: "Remote AI provider configured",
      };
    }

    throw new Error(`Unknown AI provider type: ${type}`);
  }

  static async getAvailableModels(): Promise<string[]> {
    const models = ["local"];

    // Check if remote is available
    if (config.ai?.remote?.apiKey) {
      models.push("remote");
    }

    return models;
  }
}
