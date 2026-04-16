// File: src/middleware/requestId.ts

import { NextFunction, Request, Response } from "express"

function createRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
}

declare global {
  namespace Express {
    interface Request {
      requestId?: string
    }
  }
}

export function requestIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  const incoming = req.header("x-request-id")
  const requestId = incoming && incoming.trim() !== "" ? incoming : createRequestId()

  req.requestId = requestId
  res.setHeader("x-request-id", requestId)

  next()
}