// File: src/services/billing/verifyPurchaseService.ts

import { VerifyPurchaseRequest } from "../../models/api/verifyPurchaseRequest"
import { PurchaseRecord } from "../../models/domain/purchase"
import { lookupPlayPurchaseForVerification } from "../play/playPurchaseLookupService"
import {
  normalizeOneTimePurchase,
  normalizeSubscriptionPurchase
} from "../play/playNormalizer"
import { computeEntitlementFromPurchase } from "./entitlementService"
import { AppError } from "../../types/errors"
import { createEventId } from "../../utils/ids"
import { nowIso } from "../../utils/time"
import { upsertUser } from "../../repositories/usersRepository"
import {
  getPurchaseByKey,
  upsertPurchase
} from "../../repositories/purchasesRepository"
import { upsertEntitlement } from "../../repositories/entitlementsRepository"
import {
  findEventByIdempotencyKey,
  insertEvent
} from "../../repositories/eventsRepository"

type VerifyPurchaseEventType =
  | "PURCHASE_VERIFIED"
  | "PURCHASE_UPDATED_FROM_RTDN"

type VerifyPurchaseSource = "api" | "rtdn"

export type VerifyPurchaseServiceInput = {
  appUserId: string
  packageName: string
  productType: VerifyPurchaseRequest["productType"]
  productId: string
  purchaseToken: string
  purchaseTimeMillis?: number
  obfuscatedExternalAccountId?: string | null
  appVersion?: string
  requestId: string
  idempotencyKey: string
  source: VerifyPurchaseSource
  eventType: VerifyPurchaseEventType
  extraEventPayload?: Record<string, unknown>
}

export type VerifyPurchaseServiceResult = {
  purchase: PurchaseRecord
  entitlement: ReturnType<typeof computeEntitlementFromPurchase>
  idempotent: boolean
}

export async function verifyPurchaseService(
  input: VerifyPurchaseServiceInput
): Promise<VerifyPurchaseServiceResult> {
  const existingEvent = await findEventByIdempotencyKey(input.idempotencyKey)

  if (existingEvent) {
    if (!existingEvent.purchaseKey) {
      throw new AppError(
        500,
        "IDEMPOTENCY_STATE_INCONSISTENT",
        "An idempotent event exists without a matching purchase key"
      )
    }

    const existingPurchase = await getPurchaseByKey(existingEvent.purchaseKey)

    if (!existingPurchase) {
      throw new AppError(
        500,
        "IDEMPOTENCY_STATE_INCONSISTENT",
        "An idempotent verification event exists without a matching purchase record"
      )
    }

    const entitlement = computeEntitlementFromPurchase({
      purchase: existingPurchase,
      lastEventId: existingEvent.eventId
    })

    return {
      purchase: existingPurchase,
      entitlement,
      idempotent: true
    }
  }

  await upsertUser({
    appUserId: input.appUserId,
    packageName: input.packageName
  })

  const lookupInput: VerifyPurchaseRequest = {
    appUserId: input.appUserId,
    packageName: input.packageName,
    productType: input.productType,
    productId: input.productId,
    purchaseToken: input.purchaseToken,
    purchaseTimeMillis: input.purchaseTimeMillis,
    obfuscatedExternalAccountId: input.obfuscatedExternalAccountId,
    appVersion: input.appVersion
  }

  const lookupResult = await lookupPlayPurchaseForVerification(lookupInput)

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
    type: input.eventType,
    provider: "google_play",
    appUserId: input.appUserId,
    purchaseKey: savedPurchase.purchaseKey,
    requestId: input.requestId,
    idempotencyKey: input.idempotencyKey,
    source: input.source,
    occurredAt: nowIso(),
    payload: {
      productId: savedPurchase.productId,
      productType: savedPurchase.productType,
      entitlementStatus: entitlement.status,
      tier: entitlement.tier,
      ...input.extraEventPayload
    }
  })

  return {
    purchase: savedPurchase,
    entitlement,
    idempotent: false
  }
}