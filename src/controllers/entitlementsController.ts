// File: src/controllers/entitlementsController.ts

import { Request, Response, NextFunction } from "express"
import { EntitlementResponse } from "../models/api/entitlementResponse"
import { getEntitlementByAppUserId } from "../repositories/entitlementsRepository"
import { AppError } from "../types/errors"

function isEntitlementActive(status: EntitlementResponse["entitlement"]["status"]): boolean {
  return status === "ACTIVE" || status === "GRACE_PERIOD"
}

export async function getMyEntitlementController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.appUserId) {
      throw new AppError(
        401,
        "AUTH_CONTEXT_MISSING",
        "Authenticated user context is missing"
      )
    }

    const entitlement = await getEntitlementByAppUserId(req.appUserId)

    if (!entitlement) {
      const response: EntitlementResponse = {
        ok: true,
        requestId: req.requestId,
        entitlement: {
          tier: "none",
          active: false,
          status: "INACTIVE",
          expiresAt: null,
          willRenew: false,
          sourceOfTruth: "backend"
        }
      }

      res.status(200).json(response)
      return
    }

    const response: EntitlementResponse = {
      ok: true,
      requestId: req.requestId,
      entitlement: {
        tier: entitlement.tier,
        active: isEntitlementActive(entitlement.status),
        status: entitlement.status,
        expiresAt: entitlement.expiryTime,
        willRenew: entitlement.willRenew,
        sourceOfTruth: "backend"
      }
    }

    res.status(200).json(response)
  } catch (error) {
    next(error)
  }
}