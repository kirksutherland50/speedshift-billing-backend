// File: src/services/play/rtdnService.ts

import {
  buildPurchaseKey,
  buildRtdnApplyIdempotencyKey,
  buildRtdnReceivedIdempotencyKey,
  createEventId
} from "../../utils/ids"
import { nowIso } from "../../utils/time"
import { getPurchaseByKey } from "../../repositories/purchasesRepository"
import {
  findEventByIdempotencyKey,
  insertEvent
} from "../../repositories/eventsRepository"
import { verifyPurchaseService } from "../billing/verifyPurchaseService"
import {
  extractRtdnSummary,
  parsePubSubPushEnvelope,
  validateRtdnPayload
} from "./rtdnParserService"

export interface RtdnResult {
  pubsubMessageId: string | null
  notificationKind: string
  notificationType: number | null
  notificationTypeName: string
  packageName: string | null
  productId: string | null
  purchaseToken: string | null
  handled: boolean
  skippedReason: string | null
  entitlementStatus: string | null
}

export async function handleRtdnMessage(args: {
  body: unknown
  requestId: string
}): Promise<RtdnResult> {
  const parsed = parsePubSubPushEnvelope(args.body)

  validateRtdnPayload(parsed.decodedJson)

  const summary = extractRtdnSummary(parsed.decodedJson)

  const purchaseKey =
    summary.packageName && summary.purchaseToken && summary.notificationKind === "subscription"
      ? buildPurchaseKey({
          packageName: summary.packageName,
          productType: "SUBSCRIPTION",
          purchaseToken: summary.purchaseToken
        })
      : null

  const existingPurchase = purchaseKey
    ? await getPurchaseByKey(purchaseKey)
    : null

  const receivedIdempotencyKey = buildRtdnReceivedIdempotencyKey({
    packageName: summary.packageName ?? "unknown",
    notificationKind: summary.notificationKind,
    notificationType: summary.notificationType,
    productId: summary.productId,
    purchaseToken: summary.purchaseToken,
    eventTimeMillis: parsed.decodedJson.eventTimeMillis ?? "unknown"
  })

  const existingReceivedEvent = await findEventByIdempotencyKey(receivedIdempotencyKey)

  if (!existingReceivedEvent) {
    await insertEvent({
      eventId: createEventId(),
      type: "RTDN_RECEIVED",
      provider: "google_play",
      appUserId: existingPurchase?.appUserId ?? null,
      purchaseKey,
      requestId: args.requestId,
      idempotencyKey: receivedIdempotencyKey,
      source: "rtdn",
      occurredAt: nowIso(),
      payload: {
        pubsubMessageId: parsed.pubsubMessageId,
        pubsubPublishTime: parsed.pubsubPublishTime,
        pubsubSubscription: parsed.subscription,
        rawData: parsed.rawData,
        rtdnPayload: parsed.decodedJson,
        summary
      }
    })
  }

  if (!summary.handledByCurrentImplementation) {
    return {
      pubsubMessageId: parsed.pubsubMessageId,
      notificationKind: summary.notificationKind,
      notificationType: summary.notificationType,
      notificationTypeName: summary.notificationTypeName,
      packageName: summary.packageName,
      productId: summary.productId,
      purchaseToken: summary.purchaseToken,
      handled: false,
      skippedReason: "Notification type is not handled by current implementation",
      entitlementStatus: null
    }
  }

  if (
    summary.notificationKind !== "subscription" ||
    !summary.packageName ||
    !summary.productId ||
    !summary.purchaseToken
  ) {
    return {
      pubsubMessageId: parsed.pubsubMessageId,
      notificationKind: summary.notificationKind,
      notificationType: summary.notificationType,
      notificationTypeName: summary.notificationTypeName,
      packageName: summary.packageName,
      productId: summary.productId,
      purchaseToken: summary.purchaseToken,
      handled: false,
      skippedReason: "RTDN payload is missing required subscription fields",
      entitlementStatus: null
    }
  }

  if (!existingPurchase) {
    return {
      pubsubMessageId: parsed.pubsubMessageId,
      notificationKind: summary.notificationKind,
      notificationType: summary.notificationType,
      notificationTypeName: summary.notificationTypeName,
      packageName: summary.packageName,
      productId: summary.productId,
      purchaseToken: summary.purchaseToken,
      handled: false,
      skippedReason: "No existing purchase record found for purchase token",
      entitlementStatus: null
    }
  }

  const applyIdempotencyKey = buildRtdnApplyIdempotencyKey({
    packageName: summary.packageName,
    productId: summary.productId,
    purchaseToken: summary.purchaseToken,
    notificationType: summary.notificationType,
    eventTimeMillis: parsed.decodedJson.eventTimeMillis ?? "unknown"
  })

  const verificationResult = await verifyPurchaseService({
    appUserId: existingPurchase.appUserId,
    packageName: summary.packageName,
    productType: "SUBSCRIPTION",
    productId: summary.productId,
    purchaseToken: summary.purchaseToken,
    requestId: args.requestId,
    idempotencyKey: applyIdempotencyKey,
    source: "rtdn",
    eventType: "PURCHASE_UPDATED_FROM_RTDN",
    extraEventPayload: {
      pubsubMessageId: parsed.pubsubMessageId,
      pubsubPublishTime: parsed.pubsubPublishTime,
      notificationKind: summary.notificationKind,
      notificationType: summary.notificationType,
      notificationTypeName: summary.notificationTypeName,
      rtdnEventTimeMillis: parsed.decodedJson.eventTimeMillis
    }
  })

  return {
    pubsubMessageId: parsed.pubsubMessageId,
    notificationKind: summary.notificationKind,
    notificationType: summary.notificationType,
    notificationTypeName: summary.notificationTypeName,
    packageName: summary.packageName,
    productId: summary.productId,
    purchaseToken: summary.purchaseToken,
    handled: true,
    skippedReason: null,
    entitlementStatus: verificationResult.entitlement.status
  }
}