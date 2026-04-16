// File: src/repositories/eventsRepository.ts

import { COLLECTIONS } from "../config/constants"
import { EventRecord } from "../models/domain/event"
import { getFirestore } from "./firestoreClient"

export async function insertEvent(event: EventRecord): Promise<EventRecord> {
  const db = getFirestore()
  const docRef = db.collection(COLLECTIONS.events).doc(event.eventId)

  await docRef.set(event)

  return event
}

export async function findEventByIdempotencyKey(
  idempotencyKey: string
): Promise<EventRecord | null> {
  const db = getFirestore()

  const snapshot = await db
    .collection(COLLECTIONS.events)
    .where("idempotencyKey", "==", idempotencyKey)
    .limit(1)
    .get()

  if (snapshot.empty) {
    return null
  }

  const firstDoc = snapshot.docs[0]

  if (!firstDoc) {
    return null
  }

  return firstDoc.data() as EventRecord
}