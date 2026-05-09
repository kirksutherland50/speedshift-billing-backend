// File: src/models/domain/manualEntitlementGrant.ts

export type ManualEntitlementGrantSource =
  | "manual_lifetime"
  | "trial"
  | "admin_override"

export type ManualEntitlementGrantStatus =
  | "ACTIVE"
  | "INACTIVE"
  | "REVOKED"
  | "EXPIRED"

export type ManualEntitlementGrantRecord = {
  grantId: string
  appUserId: string
  platform: "android"
  source: ManualEntitlementGrantSource
  status: ManualEntitlementGrantStatus
  tier: "pro" | "none"

  // null means no expiry, which is what we want for lifetime users.
  startsAt: string | null
  expiresAt: string | null

  note: string | null
  createdAt: string
  updatedAt: string
}