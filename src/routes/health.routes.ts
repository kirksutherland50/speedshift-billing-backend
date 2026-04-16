// File: src/routes/health.routes.ts

import { Router } from "express"
import { env } from "../config/env"

const router = Router()

router.get("/", (req, res) => {
  res.status(200).json({
    ok: true,
    requestId: req.requestId,
    service: "speedshift-billing-backend",
    environment: env.nodeEnv,
    projectId: env.googleCloudProject,
    firestoreDatabaseId: env.firestoreDatabaseId,
    packageName: env.appPackageName,
    timestamp: new Date().toISOString()
  })
})

export default router