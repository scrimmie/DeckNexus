import { z } from "zod";

// Standard API Response structure
export interface ApiResponse<T = unknown> {
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

// Request validation schemas
export const CardSearchSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  type: z.string().max(100).optional(),
  colors: z.string().max(20).optional(),
  cmc: z.string().max(10).optional(),
  commander: z.boolean().optional(),
  page: z.coerce.number().min(1).max(1000).default(1),
  limit: z.coerce.number().min(1).max(175).default(20), // Scryfall max is 175
});

export const CardByIdSchema = z.object({
  id: z.string().uuid("Invalid card ID format"),
});

export type CardSearchQuery = z.infer<typeof CardSearchSchema>;
export type CardByIdParams = z.infer<typeof CardByIdSchema>;

// Error types
export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public errors?: Record<string, string[]>
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export class ValidationError extends ApiError {
  constructor(errors: Record<string, string[]>) {
    super(400, "Validation failed", errors);
    this.name = "ValidationError";
  }
}

export class NotFoundError extends ApiError {
  constructor(resource: string) {
    super(404, `${resource} not found`);
    this.name = "NotFoundError";
  }
}

export class ExternalServiceError extends ApiError {
  constructor(service: string, message: string) {
    super(502, `${service} service error: ${message}`);
    this.name = "ExternalServiceError";
  }
}
