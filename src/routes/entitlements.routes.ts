// File: src/routes/entitlements.routes.ts

import { Router } from "express"
import { getMyEntitlementController } from "../controllers/entitlementsController"
import { authMiddleware } from "../middleware/authMiddleware"

const router = Router()

router.get("/me", authMiddleware, getMyEntitlementController)

export default router