// File: src/models/domain/entitlement.ts

export type EntitlementStatus =
  | "ACTIVE"
  | "INACTIVE"
  | "GRACE_PERIOD"
  | "ON_HOLD"
  | "PAUSED"
  | "CANCELED"
  | "EXPIRED"

export type EntitlementRecord = {
  appUserId: string
  platform: "android"
  source: "google_play"
  status: EntitlementStatus
  tier: "pro" | "none"
  productType: "SUBSCRIPTION" | "ONE_TIME"
  productId: string | null
  basePlanId: string | null
  offerId: string | null
  purchaseToken: string | null
  linkedPurchaseToken: string | null
  startTime: string | null
  expiryTime: string | null
  autoRenewing: boolean
  willRenew: boolean
  acknowledgementState: string | null
  lastVerifiedAt: string
  lastEventId: string | null
  version: number
}