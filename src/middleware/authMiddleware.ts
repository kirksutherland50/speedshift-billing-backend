// File: src/middleware/authMiddleware.ts

import { Request, Response, NextFunction } from "express"
import { verifyFirebaseIdToken } from "../services/auth/firebaseAuthService"
import { AppError } from "../types/errors"

export async function authMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new AppError(
        401,
        "MISSING_AUTH_TOKEN",
        "Authorization header must be in the format: Bearer <token>"
      )
    }

    const parts = authHeader.split(" ")

    if (parts.length !== 2 || !parts[1]) {
      throw new AppError(
        401,
        "INVALID_AUTH_HEADER",
        "Authorization header is malformed"
      )
    }

    const idToken = parts[1] // now guaranteed string

    const decoded = await verifyFirebaseIdToken(idToken)

    // 🔑 THIS is your trusted identity
    req.appUserId = decoded.uid

    next()
  } catch (error) {
    next(error)
  }
}