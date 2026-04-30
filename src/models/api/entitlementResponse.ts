// File: src/models/api/entitlementResponse.ts

export type EntitlementResponse = {
  ok: true
  requestId?: string
  entitlement: {
    tier: "pro" | "none"
    active: boolean
    status:
      | "ACTIVE"
      | "INACTIVE"
      | "GRACE_PERIOD"
      | "ON_HOLD"
      | "PAUSED"
      | "CANCELED"
      | "EXPIRED"
    expiresAt: string | null
    willRenew: boolean
    sourceOfTruth: "backend"
  }
}