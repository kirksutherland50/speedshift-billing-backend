// File: src/services/play/playPurchaseLookupService.ts

import { VerifyPurchaseRequest } from "../../models/api/verifyPurchaseRequest"
import { PlayLookupRequest } from "../../models/api/playLookupRequest"
import { PlayPurchaseLookupResult } from "../../models/domain/playPurchaseLookupResult"
import { AppError } from "../../types/errors"
import { logger } from "../../utils/logger"
import { env } from "../../config/env"
import { getPlayPublisherClient } from "./playApiClient"

type GoogleApiLikeError = {
  message?: string
  code?: number | string
  response?: {
    status?: number
    data?: unknown
  }
  errors?: unknown
}

function getUpstreamStatus(error: unknown): number | undefined {
  if (typeof error !== "object" || error === null) {
    return undefined
  }

  const maybeError = error as GoogleApiLikeError
  return maybeError.response?.status
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }

  if (typeof error === "object" && error !== null && "message" in error) {
    const message = (error as { message?: unknown }).message
    if (typeof message === "string") {
      return message
    }
  }

  return String(error)
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

export async function lookupPlayPurchase(
  input: PlayLookupRequest & { appUserId?: string }
): Promise<PlayPurchaseLookupResult> {
  if (input.packageName !== env.appPackageName) {
    throw new AppError(400, "INVALID_PACKAGE_NAME", "Package name does not match configured app", {
      receivedPackageName: input.packageName,
      expectedPackageName: env.appPackageName
    })
  }

  const publisher = getPlayPublisherClient()

  try {
    if (input.productType === "SUBSCRIPTION") {
      const response = await publisher.purchases.subscriptionsv2.get({
        packageName: input.packageName,
        token: input.purchaseToken
      })

      return {
        appUserId: input.appUserId ?? "lookup-only",
        productType: "SUBSCRIPTION",
        packageName: input.packageName,
        productId: input.productId,
        purchaseToken: input.purchaseToken,
        raw: response.data
      }
    }

    const response = await publisher.purchases.products.get({
      packageName: input.packageName,
      productId: input.productId,
      token: input.purchaseToken
    })

    return {
      appUserId: input.appUserId ?? "lookup-only",
      productType: "ONE_TIME",
      packageName: input.packageName,
      productId: input.productId,
      purchaseToken: input.purchaseToken,
      raw: response.data
    }
  } catch (error) {
    const upstreamStatus = getUpstreamStatus(error)
    const errorMessage = getErrorMessage(error)
    const errorDetails = getErrorDetails(error)

    logger.error("Play purchase lookup failed", {
      packageName: input.packageName,
      productType: input.productType,
      productId: input.productId,
      purchaseTokenPrefix: input.purchaseToken.slice(0, 12),
      ...errorDetails
    })

    if (upstreamStatus === 401 || upstreamStatus === 403) {
      throw new AppError(
        502,
        "PLAY_API_ACCESS_DENIED",
        "The backend could not access the Google Play Developer API",
        errorDetails
      )
    }

    if (upstreamStatus === 404) {
      throw new AppError(
        404,
        "PLAY_PURCHASE_NOT_FOUND",
        "Purchase was not found in Google Play",
        errorDetails
      )
    }

    if (upstreamStatus === 400) {
      throw new AppError(
        400,
        "PLAY_INVALID_PURCHASE_REFERENCE",
        "Google Play rejected the purchase reference",
        errorDetails
      )
    }

    if (upstreamStatus && upstreamStatus >= 400) {
      throw new AppError(
        502,
        "PLAY_API_ERROR",
        "Google Play API request failed",
        errorDetails
      )
    }

    throw new AppError(
      500,
      "PLAY_LOOKUP_FAILED",
      `Unexpected Play lookup failure: ${errorMessage}`,
      errorDetails
    )
  }
}

export async function lookupPlayPurchaseForVerification(
  input: VerifyPurchaseRequest
): Promise<PlayPurchaseLookupResult> {
  return lookupPlayPurchase(input)
}