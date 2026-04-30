import { Router } from "express"
import { playRtdnController } from "../controllers/playRtdnController"

const router = Router()

router.post("/rtdn", playRtdnController)

export default router