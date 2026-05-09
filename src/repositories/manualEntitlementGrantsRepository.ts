// File: src/repositories/manualEntitlementGrantsRepository.ts

import { COLLECTIONS } from "../config/constants"
import { ManualEntitlementGrantRecord } from "../models/domain/manualEntitlementGrant"
import { getFirestore } from "./firestoreClient"

function hasStarted(grant: ManualEntitlementGrantRecord, now: Date): boolean {
  if (!grant.startsAt) {
    return true
  }

  const startsAt = new Date(grant.startsAt)

  if (Number.isNaN(startsAt.getTime())) {
    return false
  }

  return startsAt.getTime() <= now.getTime()
}

function hasNotExpired(grant: ManualEntitlementGrantRecord, now: Date): boolean {
  if (!grant.expiresAt) {
    return true
  }

  const expiresAt = new Date(grant.expiresAt)

  if (Number.isNaN(expiresAt.getTime())) {
    return false
  }

  return expiresAt.getTime() > now.getTime()
}

function isActiveProGrant(grant: ManualEntitlementGrantRecord, now: Date): boolean {
  return (
    grant.tier === "pro" &&
    grant.status === "ACTIVE" &&
    hasStarted(grant, now) &&
    hasNotExpired(grant, now)
  )
}

export async function getActiveManualEntitlementGrantByAppUserId(
  appUserId: string
): Promise<ManualEntitlementGrantRecord | null> {
  const db = getFirestore()

  const snapshot = await db
    .collection(COLLECTIONS.manualEntitlementGrants)
    .where("appUserId", "==", appUserId)
    .where("tier", "==", "pro")
    .where("status", "==", "ACTIVE")
    .get()

  const now = new Date()

  const grants = snapshot.docs
    .map((doc) => doc.data() as ManualEntitlementGrantRecord)
    .filter((grant) => isActiveProGrant(grant, now))

  if (grants.length === 0) {
    return null
  }

  grants.sort((a, b) => {
    const aExpires = a.expiresAt ? new Date(a.expiresAt).getTime() : Number.POSITIVE_INFINITY
    const bExpires = b.expiresAt ? new Date(b.expiresAt).getTime() : Number.POSITIVE_INFINITY

    return bExpires - aExpires
  })

return grants[0] ?? null
}