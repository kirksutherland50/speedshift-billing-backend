// File: src/controllers/playPurchaseVerifyController.ts

import { Request, Response, NextFunction } from "express"
import { verifyPurchaseRequestSchema } from "../models/api/verifyPurchaseRequest"
import { VerifyPurchaseResponse } from "../models/api/verifyPurchaseResponse"
import { PurchaseRecord } from "../models/domain/purchase"
import { lookupPlayPurchaseForVerification } from "../services/play/playPurchaseLookupService"
import {
  normalizeOneTimePurchase,
  normalizeSubscriptionPurchase
} from "../services/play/playNormalizer"
import { computeEntitlementFromPurchase } from "../services/billing/entitlementService"
import { AppError } from "../types/errors"
import {
  buildVerifyIdempotencyKey,
  createEventId
} from "../utils/ids"
import { nowIso } from "../utils/time"
import { upsertUser } from "../repositories/usersRepository"
import {
  getPurchaseByKey,
  upsertPurchase
} from "../repositories/purchasesRepository"
import { upsertEntitlement } from "../repositories/entitlementsRepository"
import {
  findEventByIdempotencyKey,
  insertEvent
} from "../repositories/eventsRepository"

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

    const existingEvent = await findEventByIdempotencyKey(idempotencyKey)

    if (existingEvent) {
      const purchaseKey = existingEvent.purchaseKey
      const existingPurchase = await getPurchaseByKey(purchaseKey)

      if (!existingPurchase) {
        throw new AppError(
          500,
          "IDEMPOTENCY_STATE_INCONSISTENT",
          "An idempotent verification event exists without a matching purchase record"
        )
      }

      res.status(200).json(
        toVerifyResponse({
          requestId: req.requestId,
          purchase: existingPurchase
        })
      )
      return
    }

    await upsertUser({
      appUserId: input.appUserId,
      packageName: input.packageName
    })

    const lookupResult = await lookupPlayPurchaseForVerification(input)

    const normalizedPurchase =
      lookupResult.productType === "SUBSCRIPTION"
        ? normalizeSubscriptionPurchase({
            appUserId: input.appUserId,
            packageName: lookupResult.packageName,
            productId: lookupResult.productId,
            purchaseToken: lookupResult.purchaseToken,
            raw: lookupResult.raw
          })
        : normalizeOneTimePurchase({
            appUserId: input.appUserId,
            packageName: lookupResult.packageName,
            productId: lookupResult.productId,
            purchaseToken: lookupResult.purchaseToken,
            raw: lookupResult.raw
          })

    const existingPurchase = await getPurchaseByKey(normalizedPurchase.purchaseKey)

    if (
      existingPurchase &&
      existingPurchase.appUserId !== input.appUserId
    ) {
      throw new AppError(
        409,
        "PURCHASE_TOKEN_OWNERSHIP_CONFLICT",
        "This purchase token is already associated with a different user",
        {
          purchaseKey: normalizedPurchase.purchaseKey
        }
      )
    }

    const purchaseToSave: PurchaseRecord = {
      ...normalizedPurchase,
      createdAt: existingPurchase?.createdAt ?? normalizedPurchase.createdAt,
      updatedAt: nowIso()
    }

    const savedPurchase = await upsertPurchase(purchaseToSave, existingPurchase)

    const eventId = createEventId()

    const entitlement = computeEntitlementFromPurchase({
      purchase: savedPurchase,
      lastEventId: eventId
    })

    await upsertEntitlement(entitlement)

    await insertEvent({
      eventId,
      type: "PURCHASE_VERIFIED",
      provider: "google_play",
      appUserId: input.appUserId,
      purchaseKey: savedPurchase.purchaseKey,
      requestId: req.requestId ?? "unknown",
      idempotencyKey,
      source: "api",
      occurredAt: nowIso(),
      payload: {
        productId: savedPurchase.productId,
        productType: savedPurchase.productType,
        entitlementStatus: entitlement.status,
        tier: entitlement.tier
      }
    })

    const response: VerifyPurchaseResponse = {
      ok: true,
      requestId: req.requestId,
      purchase: {
        provider: "google_play",
        productType: savedPurchase.productType,
        productId: savedPurchase.productId,
        purchaseToken: savedPurchase.purchaseToken,
        purchaseState: savedPurchase.purchaseState,
        acknowledgementState: savedPurchase.acknowledgementState,
        orderId: savedPurchase.orderId
      },
      entitlement: {
        status: entitlement.status,
        tier: entitlement.tier,
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