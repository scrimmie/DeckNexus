interface Config {
  port: number;
  nodeEnv: string;
  corsOrigin: string[];
  rateLimitWindowMs: number;
  rateLimitMax: number;
  ai?: {
    defaultProvider?: "local" | "remote";
    local?: {
      baseUrl?: string;
      model?: string;
    };
    remote?: {
      apiKey?: string;
      baseUrl?: string;
      model?: string;
    };
  };
}

const config: Config = {
  port: parseInt(process.env.PORT || "3001"),
  nodeEnv: process.env.NODE_ENV || "development",
  corsOrigin:
    process.env.NODE_ENV === "production"
      ? ["https://your-frontend-domain.com"]
      : ["http://localhost:5173", "http://localhost:3000"],
  rateLimitWindowMs: 15 * 60 * 1000, // 15 minutes
  rateLimitMax: 100, // limit each IP to 100 requests per windowMs
  ai: {
    defaultProvider:
      (process.env.AI_DEFAULT_PROVIDER as "local" | "remote") || "local",
    local: {
      baseUrl: process.env.LM_STUDIO_BASE_URL || "http://localhost:1234",
      model: process.env.LM_STUDIO_MODEL || "default",
    },
    remote: {
      apiKey: process.env.OPENROUTER_API_KEY,
      baseUrl:
        process.env.OPENROUTER_BASE_URL || "https://openrouter.ai/api/v1",
      model: process.env.OPENROUTER_MODEL || "anthropic/claude-3-sonnet",
    },
  },
};

export default config;
