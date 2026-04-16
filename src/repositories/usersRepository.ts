// File: src/repositories/usersRepository.ts

import { COLLECTIONS } from "../config/constants"
import { getFirestore } from "./firestoreClient"
import { nowIso } from "../utils/time"

export type UserRecord = {
  appUserId: string
  createdAt: string
  updatedAt: string
  lastSeenAt: string
  platform: "android"
  packageName: string
}

export async function upsertUser(args: {
  appUserId: string
  packageName: string
}): Promise<UserRecord> {
  const db = getFirestore()
  const docRef = db.collection(COLLECTIONS.users).doc(args.appUserId)
  const snapshot = await docRef.get()
  const now = nowIso()

  const existing = snapshot.exists ? (snapshot.data() as Partial<UserRecord>) : null

  const record: UserRecord = {
    appUserId: args.appUserId,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
    lastSeenAt: now,
    platform: "android",
    packageName: args.packageName
  }

  await docRef.set(record, { merge: true })

  return record
}