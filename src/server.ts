// File: src/server.ts

import { createApp } from "./app"
import { env } from "./config/env"
import { logger } from "./utils/logger"

const app = createApp()

app.listen(env.port, () => {
  logger.info("Server started", {
    port: env.port,
    environment: env.nodeEnv,
    projectId: env.googleCloudProject,
    firestoreDatabaseId: env.firestoreDatabaseId
  })
})