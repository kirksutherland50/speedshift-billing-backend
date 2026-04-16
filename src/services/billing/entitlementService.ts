// File: src/services/billing/entitlementService.ts

import { ENTITLEMENT_VERSION } from "../../config/constants"
import { EntitlementRecord, EntitlementStatus } from "../../models/domain/entitlement"
import { PurchaseRecord } from "../../models/domain/purchase"
import { isFutureIso } from "../../utils/time"

function resolveSubscriptionEntitlementStatus(purchase: PurchaseRecord): EntitlementStatus {
  switch (purchase.subscriptionState) {
    case "SUBSCRIPTION_STATE_ACTIVE":
      return isFutureIso(purchase.expiryTime) ? "ACTIVE" : "EXPIRED"

    case "SUBSCRIPTION_STATE_IN_GRACE_PERIOD":
      return isFutureIso(purchase.expiryTime) ? "GRACE_PERIOD" : "EXPIRED"

    case "SUBSCRIPTION_STATE_ON_HOLD":
      return "ON_HOLD"

    case "SUBSCRIPTION_STATE_PAUSED":
      return "PAUSED"

    case "SUBSCRIPTION_STATE_CANCELED":
      return isFutureIso(purchase.expiryTime) ? "CANCELED" : "EXPIRED"

    case "SUBSCRIPTION_STATE_EXPIRED":
      return "EXPIRED"

    case "SUBSCRIPTION_STATE_PENDING":
      return "INACTIVE"

    default:
      return "INACTIVE"
  }
}

function resolveOneTimeEntitlementStatus(purchase: PurchaseRecord): EntitlementStatus {
  if (purchase.purchaseState === "PURCHASED") {
    return "ACTIVE"
  }

  return "INACTIVE"
}

export function computeEntitlementFromPurchase(args: {
  purchase: PurchaseRecord
  lastEventId: string | null
}): EntitlementRecord {
  const { purchase, lastEventId } = args

  const status =
    purchase.productType === "SUBSCRIPTION"
      ? resolveSubscriptionEntitlementStatus(purchase)
      : resolveOneTimeEntitlementStatus(purchase)

  const tier: "pro" | "none" =
    status === "ACTIVE" ||
    status === "GRACE_PERIOD" ||
    status === "ON_HOLD" ||
    status === "PAUSED" ||
    status === "CANCELED"
      ? "pro"
      : "none"

  return {
    appUserId: purchase.appUserId,
    platform: "android",
    source: "google_play",
    status,
    tier,
    productType: purchase.productType,
    productId: purchase.productId,
    basePlanId: purchase.basePlanId,
    offerId: purchase.offerId,
    purchaseToken: purchase.purchaseToken,
    linkedPurchaseToken: purchase.linkedPurchaseToken,
    startTime: purchase.startTime,
    expiryTime: purchase.expiryTime,
    autoRenewing: purchase.autoRenewing,
    willRenew: purchase.willRenew,
    acknowledgementState: purchase.acknowledgementState,
    lastVerifiedAt: purchase.lastVerifiedAt,
    lastEventId,
    version: ENTITLEMENT_VERSION
  }
}