import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { ApiError, ApiResponse } from "@/types/api";

export function errorHandler(
  error: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  console.error("Error:", error);

  // Handle Zod validation errors
  if (error instanceof ZodError) {
    const validationErrors: Record<string, string[]> = {};
    error.errors.forEach((err) => {
      const field = err.path.join(".");
      if (!validationErrors[field]) {
        validationErrors[field] = [];
      }
      validationErrors[field].push(err.message);
    });

    const response: ApiResponse = {
      status: "error",
      message: "Validation failed",
      errors: validationErrors,
    };

    return res.status(400).json(response);
  }

  // Handle custom API errors
  if (error instanceof ApiError) {
    const response: ApiResponse = {
      status: "error",
      message: error.message,
      errors: error.errors,
    };

    return res.status(error.statusCode).json(response);
  }

  // Handle generic errors
  const response: ApiResponse = {
    status: "error",
    message: "Internal server error",
  };

  return res.status(500).json(response);
}

export function notFoundHandler(req: Request, res: Response) {
  const response: ApiResponse = {
    status: "error",
    message: `Route ${req.originalUrl} not found`,
  };

  res.status(404).json(response);
}
