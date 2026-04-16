// File: src/routes/health.repositories.routes.ts

import { Router } from "express"
import { createEventId } from "../utils/ids"
import { nowIso } from "../utils/time"
import { upsertUser } from "../repositories/usersRepository"
import { insertEvent } from "../repositories/eventsRepository"

const router = Router()

router.get("/", async (req, res, next) => {
  try {
    const user = await upsertUser({
      appUserId: "health-check-user",
      packageName: "com.speedshift.app"
    })

    const event = await insertEvent({
      eventId: createEventId(),
      type: "PURCHASE_VERIFIED",
      provider: "google_play",
      appUserId: user.appUserId,
      purchaseKey: "health-check-purchase",
      requestId: req.requestId ?? "unknown",
      idempotencyKey: "health-check-idempotency",
      source: "api",
      occurredAt: nowIso(),
      payload: {
        reason: "repository_smoke_test"
      }
    })

    res.status(200).json({
      ok: true,
      requestId: req.requestId,
      user,
      event
    })
  } catch (error) {
    next(error)
  }
})

export default router