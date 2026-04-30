// File: src/app.ts

import express from "express"
import entitlementsRoutes from "./routes/entitlements.routes"
import { ROUTES } from "./config/constants"
import { errorHandler, notFoundHandler } from "./middleware/errorHandler"
import { requestIdMiddleware } from "./middleware/requestId"
import healthFirestoreRoutes from "./routes/health.firestore.routes"
import healthPlayRoutes from "./routes/health.play.routes"
import healthRepositoriesRoutes from "./routes/health.repositories.routes"
import healthRoutes from "./routes/health.routes"
import playRoutes from "./routes/play.routes"
import playRtdnRoutes from "./routes/play.rtdn.routes"
import { logger } from "./utils/logger"

function assertRouter(name: string, value: unknown): void {
  if (!value) {
    throw new Error(`Route import is undefined: ${name}`)
  }
}

export function createApp() {
  assertRouter("healthRoutes", healthRoutes)
  assertRouter("healthFirestoreRoutes", healthFirestoreRoutes)
  assertRouter("healthPlayRoutes", healthPlayRoutes)
  assertRouter("healthRepositoriesRoutes", healthRepositoriesRoutes)
  assertRouter("playRoutes", playRoutes)
  assertRouter("playRtdnRoutes", playRtdnRoutes)
  assertRouter("entitlementsRoutes", entitlementsRoutes)

  const app = express()

  app.use(express.json())
  app.use(requestIdMiddleware)

  app.use((req, _res, next) => {
    logger.info("Incoming request", {
      requestId: req.requestId,
      method: req.method,
      path: req.originalUrl
    })
    next()
  })

  app.use(ROUTES.health, healthRoutes)
  app.use(ROUTES.healthFirestore, healthFirestoreRoutes)
  app.use(ROUTES.healthPlay, healthPlayRoutes)
  app.use(ROUTES.healthRepositories, healthRepositoriesRoutes)
  app.use("/play", playRoutes)
  app.use("/play", playRtdnRoutes)
  app.use("/entitlements", entitlementsRoutes)

  app.use(notFoundHandler)
  app.use(errorHandler)

  return app
}