// File: src/controllers/playPurchaseVerifyController.ts

import { Request, Response, NextFunction } from "express"
import { verifyPurchaseRequestSchema } from "../models/api/verifyPurchaseRequest"
import { VerifyPurchaseResponse } from "../models/api/verifyPurchaseResponse"
import { PurchaseRecord } from "../models/domain/purchase"
import { computeEntitlementFromPurchase } from "../services/billing/entitlementService"
import { buildVerifyIdempotencyKey } from "../utils/ids"
import { verifyPurchaseService } from "../services/billing/verifyPurchaseService"
import { AppError } from "../types/errors"

function toVerifyResponse(args: {
  requestId: string | undefined
  purchase: PurchaseRecord
}): VerifyPurchaseResponse {
  const entitlement = computeEntitlementFromPurchase({
    purchase: args.purchase,
    lastEventId: null
  })

  return {
    ok: true,
    requestId: args.requestId,
    purchase: {
      provider: "google_play",
      productType: args.purchase.productType,
      productId: args.purchase.productId,
      purchaseToken: args.purchase.purchaseToken,
      purchaseState: args.purchase.purchaseState,
      acknowledgementState: args.purchase.acknowledgementState,
      orderId: args.purchase.orderId
    },
    entitlement: {
      status: entitlement.status,
      tier: entitlement.tier,
      expiresAt: entitlement.expiryTime,
      willRenew: entitlement.willRenew,
      sourceOfTruth: "backend"
    }
  }
}

export async function playPurchaseVerifyController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const parsed = verifyPurchaseRequestSchema.safeParse(req.body)

    if (!parsed.success) {
      throw new AppError(400, "INVALID_REQUEST", "Invalid verify purchase request", {
        issues: parsed.error.flatten()
      })
    }

    const input = parsed.data

    const idempotencyKey = buildVerifyIdempotencyKey({
      packageName: input.packageName,
      productType: input.productType,
      purchaseToken: input.purchaseToken,
      appUserId: input.appUserId
    })

    const result = await verifyPurchaseService({
      appUserId: input.appUserId,
      packageName: input.packageName,
      productType: input.productType,
      productId: input.productId,
      purchaseToken: input.purchaseToken,
      purchaseTimeMillis: input.purchaseTimeMillis,
      obfuscatedExternalAccountId: input.obfuscatedExternalAccountId,
      appVersion: input.appVersion,
      requestId: req.requestId ?? "unknown",
      idempotencyKey,
      source: "api",
      eventType: "PURCHASE_VERIFIED"
    })

    res.status(200).json(
      toVerifyResponse({
        requestId: req.requestId,
        purchase: result.purchase
      })
    )
  } catch (error) {
    next(error)
  }
}