// File: src/repositories/entitlementsRepository.ts

import { COLLECTIONS } from "../config/constants"
import { EntitlementRecord } from "../models/domain/entitlement"
import { getFirestore } from "./firestoreClient"

export async function getEntitlementByAppUserId(
  appUserId: string
): Promise<EntitlementRecord | null> {
  const db = getFirestore()
  const docRef = db.collection(COLLECTIONS.entitlements).doc(appUserId)
  const snapshot = await docRef.get()

  if (!snapshot.exists) {
    return null
  }

  return snapshot.data() as EntitlementRecord
}

export async function upsertEntitlement(
  entitlement: EntitlementRecord
): Promise<EntitlementRecord> {
  const db = getFirestore()
  const docRef = db.collection(COLLECTIONS.entitlements).doc(entitlement.appUserId)

  await docRef.set(entitlement, { merge: true })

  return entitlement
}