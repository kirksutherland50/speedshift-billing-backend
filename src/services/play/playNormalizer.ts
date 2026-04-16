// File: src/services/play/playNormalizer.ts

import { PurchaseRecord } from "../../models/domain/purchase"
import { nowIso, toIsoOrNull, epochMillisToIsoOrNull } from "../../utils/time"
import { buildPurchaseKey } from "../../utils/ids"

type SubscriptionLineItem = {
  productId?: string
  expiryTime?: string
  latestSuccessfulOrderId?: string
  autoRenewingPlan?: Record<string, unknown>
  offerDetails?: {
    basePlanId?: string
    offerId?: string
  }
}

type SubscriptionPurchaseV2 = {
  subscriptionState?: string
  acknowledgementState?: string
  linkedPurchaseToken?: string
  startTime?: string
  lineItems?: SubscriptionLineItem[]
}

type ProductPurchaseV1 = {
  orderId?: string
  purchaseState?: number
  acknowledgementState?: number
  purchaseTimeMillis?: string
}

function mapOneTimePurchaseState(value: number | undefined): string {
  switch (value) {
    case 0:
      return "PURCHASED"
    case 1:
      return "CANCELED"
    case 2:
      return "PENDING"
    default:
      return "UNKNOWN"
  }
}

function mapOneTimeAcknowledgementState(value: number | undefined): string | null {
  switch (value) {
    case 0:
      return "YET_TO_BE_ACKNOWLEDGED"
    case 1:
      return "ACKNOWLEDGED"
    default:
      return null
  }
}

function mapSubscriptionPurchaseState(subscriptionState: string | undefined): string {
  if (!subscriptionState) {
    return "UNKNOWN"
  }

  if (subscriptionState === "SUBSCRIPTION_STATE_ACTIVE") {
    return "PURCHASED"
  }

  if (subscriptionState === "SUBSCRIPTION_STATE_PENDING") {
    return "PENDING"
  }

  return subscriptionState
}

export function normalizeSubscriptionPurchase(args: {
  appUserId: string
  packageName: string
  productId: string
  purchaseToken: string
  raw: unknown
}): PurchaseRecord {
  const now = nowIso()
  const rawPurchase = args.raw as SubscriptionPurchaseV2
  const firstLineItem = rawPurchase.lineItems?.[0]

  return {
    purchaseKey: buildPurchaseKey({
      packageName: args.packageName,
      productType: "SUBSCRIPTION",
      purchaseToken: args.purchaseToken
    }),
    appUserId: args.appUserId,
    provider: "google_play",
    platform: "android",
    packageName: args.packageName,
    productType: "SUBSCRIPTION",
    productId: firstLineItem?.productId ?? args.productId,
    basePlanId: firstLineItem?.offerDetails?.basePlanId ?? null,
    offerId: firstLineItem?.offerDetails?.offerId ?? null,
    purchaseToken: args.purchaseToken,
    linkedPurchaseToken: rawPurchase.linkedPurchaseToken ?? null,
    orderId: firstLineItem?.latestSuccessfulOrderId ?? null,
    purchaseState: mapSubscriptionPurchaseState(rawPurchase.subscriptionState),
    subscriptionState: rawPurchase.subscriptionState ?? null,
    acknowledgementState: rawPurchase.acknowledgementState ?? null,
    startTime: toIsoOrNull(rawPurchase.startTime),
    expiryTime: toIsoOrNull(firstLineItem?.expiryTime),
    autoRenewing: !!firstLineItem?.autoRenewingPlan,
    willRenew: !!firstLineItem?.autoRenewingPlan,
    raw: args.raw,
    lastVerifiedAt: now,
    createdAt: now,
    updatedAt: now
  }
}

export function normalizeOneTimePurchase(args: {
  appUserId: string
  packageName: string
  productId: string
  purchaseToken: string
  raw: unknown
}): PurchaseRecord {
  const now = nowIso()
  const rawPurchase = args.raw as ProductPurchaseV1

  return {
    purchaseKey: buildPurchaseKey({
      packageName: args.packageName,
      productType: "ONE_TIME",
      purchaseToken: args.purchaseToken
    }),
    appUserId: args.appUserId,
    provider: "google_play",
    platform: "android",
    packageName: args.packageName,
    productType: "ONE_TIME",
    productId: args.productId,
    basePlanId: null,
    offerId: null,
    purchaseToken: args.purchaseToken,
    linkedPurchaseToken: null,
    orderId: rawPurchase.orderId ?? null,
    purchaseState: mapOneTimePurchaseState(rawPurchase.purchaseState),
    subscriptionState: null,
    acknowledgementState: mapOneTimeAcknowledgementState(rawPurchase.acknowledgementState),
    startTime: epochMillisToIsoOrNull(rawPurchase.purchaseTimeMillis),
    expiryTime: null,
    autoRenewing: false,
    willRenew: false,
    raw: args.raw,
    lastVerifiedAt: now,
    createdAt: now,
    updatedAt: now
  }
}