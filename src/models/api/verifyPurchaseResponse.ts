// File: src/models/api/verifyPurchaseResponse.ts

export type VerifyPurchaseResponse = {
  ok: true
  requestId?: string
  purchase: {
    provider: "google_play"
    productType: "SUBSCRIPTION" | "ONE_TIME"
    productId: string
    purchaseToken: string
    purchaseState: string
    acknowledgementState: string | null
    orderId: string | null
  }
  entitlement: {
    status: "ACTIVE" | "INACTIVE" | "GRACE_PERIOD" | "ON_HOLD" | "PAUSED" | "CANCELED" | "EXPIRED"
    tier: "pro" | "none"
    expiresAt: string | null
    willRenew: boolean
    sourceOfTruth: "backend"
  }
}