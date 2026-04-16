// File: src/repositories/firestoreClient.ts

import { Firestore } from "@google-cloud/firestore"
import { env } from "../config/env"

let firestoreInstance: Firestore | null = null

export function getFirestore(): Firestore {
  if (firestoreInstance) {
    return firestoreInstance
  }

  firestoreInstance = new Firestore({
    projectId: env.googleCloudProject,
    databaseId: env.firestoreDatabaseId
  })

  return firestoreInstance
}