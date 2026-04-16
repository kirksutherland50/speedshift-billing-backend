// File: src/models/domain/purchase.ts

export type PurchaseProvider = "google_play"
export type PurchaseProductType = "SUBSCRIPTION" | "ONE_TIME"

export type PurchaseRecord = {
  purchaseKey: string
  appUserId: string
  provider: PurchaseProvider
  platform: "android"
  packageName: string
  productType: PurchaseProductType
  productId: string
  basePlanId: string | null
  offerId: string | null
  purchaseToken: string
  linkedPurchaseToken: string | null
  orderId: string | null
  purchaseState: string
  subscriptionState: string | null
  acknowledgementState: string | null
  startTime: string | null
  expiryTime: string | null
  autoRenewing: boolean
  willRenew: boolean
  raw: unknown
  lastVerifiedAt: string
  createdAt: string
  updatedAt: string
}