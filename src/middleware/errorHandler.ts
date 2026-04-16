// File: src/middleware/errorHandler.ts

import { NextFunction, Request, Response } from "express"
import { AppError } from "../types/errors"
import { logger } from "../utils/logger"

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    ok: false,
    requestId: req.requestId,
    error: {
      code: "NOT_FOUND",
      message: "Route not found"
    }
  })
}

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof AppError) {
    logger.warn("Handled application error", {
      requestId: req.requestId,
      method: req.method,
      path: req.originalUrl,
      code: err.code,
      statusCode: err.statusCode,
      details: err.details
    })

    res.status(err.statusCode).json({
      ok: false,
      requestId: req.requestId,
      error: {
        code: err.code,
        message: err.message,
        details: err.details ?? null
      }
    })
    return
  }

  logger.error("Unhandled request error", {
    requestId: req.requestId,
    method: req.method,
    path: req.originalUrl,
    error: err instanceof Error ? err.message : String(err)
  })

  res.status(500).json({
    ok: false,
    requestId: req.requestId,
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message: "An unexpected error occurred"
    }
  })
}