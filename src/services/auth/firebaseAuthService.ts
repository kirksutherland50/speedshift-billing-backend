// File: src/services/auth/firebaseAuthService.ts

import admin from "firebase-admin"
import { AppError } from "../../types/errors"

let firebaseApp: admin.app.App | null = null

function getFirebaseApp(): admin.app.App {
  if (!firebaseApp) {
    firebaseApp = admin.initializeApp()
  }

  return firebaseApp
}

export async function verifyFirebaseIdToken(idToken: string): Promise<admin.auth.DecodedIdToken> {
  try {
    return await getFirebaseApp().auth().verifyIdToken(idToken)
  } catch {
    throw new AppError(
      401,
      "INVALID_FIREBASE_ID_TOKEN",
      "Firebase ID token is invalid or expired"
    )
  }
}