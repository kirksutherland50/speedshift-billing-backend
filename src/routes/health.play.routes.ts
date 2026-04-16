// File: src/routes/health.play.routes.ts

import { Router } from "express"
import { playLookupRequestSchema } from "../models/api/playLookupRequest"
import { lookupPlayPurchase } from "../services/play/playPurchaseLookupService"
import { AppError } from "../types/errors"
import { getPlayPublisherClient } from "../services/play/playApiClient"

const router = Router()

router.get("/", async (req, res, next) => {
  try {
    const client = getPlayPublisherClient()

    res.status(200).json({
      ok: true,
      requestId: req.requestId,
      playApi: {
        clientCreated: true,
        version: "v3",
        packageNameConfigured: "com.speedshift.app",
        hasClient: !!client
      }
    })
  } catch (error) {
    next(error)
  }
})

router.post("/lookup", async (req, res, next) => {
  try {
    const parsed = playLookupRequestSchema.safeParse(req.body)

    if (!parsed.success) {
      throw new AppError(400, "INVALID_REQUEST", "Invalid lookup request", {
        issues: parsed.error.flatten()
      })
    }

    const result = await lookupPlayPurchase(parsed.data)

    res.status(200).json({
      ok: true,
      requestId: req.requestId,
      result
    })
  } catch (error) {
    next(error)
  }
})

export default router