// File: src/controllers/playRtdnController.ts

import { Request, Response } from "express"
import { logger } from "../utils/logger"
import { handleRtdnMessage } from "../services/play/rtdnService"
import { RtdnParserError } from "../services/play/rtdnParserService"

export async function playRtdnController(req: Request, res: Response): Promise<void> {
  try {
    const result = await handleRtdnMessage({
      body: req.body,
      requestId: req.requestId ?? "unknown"
    })

    res.status(200).json({
      ok: true,
      message: "RTDN received",
      result
    })
  } catch (error) {
    if (error instanceof RtdnParserError) {
      logger.warn("RTDN parse/validation error", {
        requestId: req.requestId,
        message: error.message,
        body: req.body
      })

      res.status(200).json({
        ok: false,
        message: error.message
      })
      return
    }

    logger.error("Unexpected RTDN error", {
      requestId: req.requestId,
      error
    })

    res.status(200).json({
      ok: false,
      message: "RTDN processing failed"
    })
  }
}