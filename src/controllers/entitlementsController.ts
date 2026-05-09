// File: src/controllers/entitlementsController.ts

import { Request, Response, NextFunction } from "express"
import { EntitlementResponse } from "../models/api/entitlementResponse"
import { getEntitlementByAppUserId } from "../repositories/entitlementsRepository"
import { AppError } from "../types/errors"
import { getActiveManualEntitlementGrantByAppUserId } from "../repositories/manualEntitlementGrantsRepository"

function isEntitlementActive(args: {
  tier: EntitlementResponse["entitlement"]["tier"]
  status: EntitlementResponse["entitlement"]["status"]
}): boolean {
  if (args.tier !== "pro") {
    return false
  }

  return (
    args.status === "ACTIVE" ||
    args.status === "GRACE_PERIOD" ||
    args.status === "ON_HOLD" ||
    args.status === "PAUSED" ||
    args.status === "CANCELED"
  )
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

const manualGrant = await getActiveManualEntitlementGrantByAppUserId(req.appUserId)

if (manualGrant) {
  const response: EntitlementResponse = {
    ok: true,
    requestId: req.requestId,
    entitlement: {
      tier: "pro",
      active: true,
      status: "ACTIVE",
      expiresAt: manualGrant.expiresAt,
      willRenew: false,
      source: manualGrant.source,
      sourceOfTruth: "backend"
    }
  }

  res.status(200).json(response)
  return
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
          source: "none",
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
active: isEntitlementActive({
  tier: entitlement.tier,
  status: entitlement.status
}),
        status: entitlement.status,
        expiresAt: entitlement.expiryTime,
        willRenew: entitlement.willRenew,
        source: entitlement.source,
        sourceOfTruth: "backend"
      }
    }

    res.status(200).json(response)
  } catch (error) {
    next(error)
  }
}