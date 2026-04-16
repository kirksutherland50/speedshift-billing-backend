import { Router } from "express"
import { playPurchaseVerifyController } from "../controllers/playPurchaseVerifyController"

const router = Router()

router.post("/purchase/verify", playPurchaseVerifyController)

export default router