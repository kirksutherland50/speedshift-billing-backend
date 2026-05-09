// File: src/services/play/playPurchaseAcknowledgeService.ts

import { AppError } from "../../types/errors"
import { logger } from "../../utils/logger"
import { getPlayPublisherClient } from "./playApiClient"

type AcknowledgeSubscriptionPurchaseInput = {
packageName: string
productId: string
purchaseToken: string
acknowledgementState: string | null
}

type GoogleApiLikeError = {
message?: string
code?: number | string
response?: {
status?: number
data?: unknown
}
errors?: unknown
}

function getErrorDetails(error: unknown): Record<string, unknown> {
  if (typeof error !== "object" || error === null) {
    return { rawError: String(error) }
  }

  const maybeError = error as GoogleApiLikeError

  return {
    message: maybeError.message ?? null,
    code: maybeError.code ?? null,
    upstreamStatus: maybeError.response?.status ?? null,
    upstreamData: maybeError.response?.data ?? null,
    errors: maybeError.errors ?? null
  }
}

function isAlreadyAcknowledged(acknowledgementState: string | null): boolean {
  return acknowledgementState === "ACKNOWLEDGEMENT_STATE_ACKNOWLEDGED"
}

function isPendingAcknowledgement(acknowledgementState: string | null): boolean {
  return acknowledgementState === "ACKNOWLEDGEMENT_STATE_PENDING"
}

export async function acknowledgeSubscriptionPurchaseIfNeeded(
  input: AcknowledgeSubscriptionPurchaseInput
): Promise<void> {
  if (isAlreadyAcknowledged(input.acknowledgementState)) {
    logger.info("Play subscription already acknowledged", {
      packageName: input.packageName,
      productId: input.productId,
      purchaseTokenPrefix: input.purchaseToken.slice(0, 12)
    })

    return
  }

  if (!isPendingAcknowledgement(input.acknowledgementState)) {
    logger.info("Skipping Play subscription acknowledgement due to non-pending acknowledgement state", {
      packageName: input.packageName,
      productId: input.productId,
      acknowledgementState: input.acknowledgementState,
      purchaseTokenPrefix: input.purchaseToken.slice(0, 12)
    })

    return
  }

  const publisher = getPlayPublisherClient()

  try {
    await publisher.purchases.subscriptions.acknowledge({
      packageName: input.packageName,
      subscriptionId: input.productId,
      token: input.purchaseToken,
      requestBody: {}
    })

    logger.info("Play subscription acknowledged", {
      packageName: input.packageName,
      productId: input.productId,
      purchaseTokenPrefix: input.purchaseToken.slice(0, 12)
    })
  } catch (error) {
    const errorDetails = getErrorDetails(error)

    logger.error("Play subscription acknowledgement failed", {
      packageName: input.packageName,
      productId: input.productId,
      purchaseTokenPrefix: input.purchaseToken.slice(0, 12),
      ...errorDetails
    })

    throw new AppError(
      502,
      "PLAY_SUBSCRIPTION_ACKNOWLEDGEMENT_FAILED",
      "The backend verified the purchase but could not acknowledge it with Google Play",
      errorDetails
)
}
}