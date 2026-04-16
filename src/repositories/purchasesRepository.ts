// File: src/repositories/purchasesRepository.ts

import { COLLECTIONS } from "../config/constants"
import { PurchaseRecord } from "../models/domain/purchase"
import { getFirestore } from "./firestoreClient"

export async function getPurchaseByKey(purchaseKey: string): Promise<PurchaseRecord | null> {
  const db = getFirestore()
  const docRef = db.collection(COLLECTIONS.purchases).doc(purchaseKey)
  const snapshot = await docRef.get()

  if (!snapshot.exists) {
    return null
  }

  return snapshot.data() as PurchaseRecord
}

export async function upsertPurchase(
  purchase: PurchaseRecord,
  existing?: PurchaseRecord | null
): Promise<PurchaseRecord> {
  const db = getFirestore()
  const docRef = db.collection(COLLECTIONS.purchases).doc(purchase.purchaseKey)

  const record: PurchaseRecord = {
    ...purchase,
    createdAt: existing?.createdAt ?? purchase.createdAt
  }

  await docRef.set(record, { merge: true })

  return record
}

export async function getPurchasesByAppUserId(
  appUserId: string
): Promise<PurchaseRecord[]> {
  const db = getFirestore()

  const snapshot = await db
    .collection(COLLECTIONS.purchases)
    .where("appUserId", "==", appUserId)
    .get()

  return snapshot.docs.map(doc => doc.data() as PurchaseRecord)
}