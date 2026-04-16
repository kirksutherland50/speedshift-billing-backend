// File: src/routes/health.firestore.routes.ts

import { Router } from "express"
import { env } from "../config/env"
import { getFirestore } from "../repositories/firestoreClient"

const router = Router()

router.get("/", async (req, res, next) => {
  try {
    const db = getFirestore()

    const docRef = db.collection("_health").doc("firestore")
    const now = new Date().toISOString()

    await docRef.set(
      {
        lastCheckedAt: now,
        checkedBy: "health.firestore",
        requestId: req.requestId
      },
      { merge: true }
    )

    const snapshot = await docRef.get()

    res.status(200).json({
      ok: true,
      requestId: req.requestId,
      firestore: {
        connected: true,
        databaseId: env.firestoreDatabaseId,
        documentExists: snapshot.exists,
        data: snapshot.data() ?? null
      }
    })
  } catch (error) {
    next(error)
  }
})

export default router