// File: src/routes/health.firestore.routes.ts

import { Router } from "express"
import { getFirestore } from "../repositories/firestoreClient"

const router = Router()

router.get("/", async (req, res, next) => {
  try {
    const db = getFirestore()

    // Small harmless write/read proof so we know the backend can use the named DB.
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
        databaseId: db.formattedName,
        documentExists: snapshot.exists,
        data: snapshot.data() ?? null
      }
    })
  } catch (error) {
    next(error)
  }
})

export default router