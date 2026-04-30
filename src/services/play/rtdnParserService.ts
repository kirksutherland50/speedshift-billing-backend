import { GooglePlayRtdnPayload, ParsedRtdnMessage, PubSubPushMessage } from "../../models/rtdn"
import {
  getSubscriptionNotificationTypeName,
  HANDLED_SUBSCRIPTION_NOTIFICATION_TYPES
} from "./rtdnTypes"

export class RtdnParserError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "RtdnParserError"
  }
}

export function parsePubSubPushEnvelope(body: unknown): ParsedRtdnMessage {
  if (!body || typeof body !== "object") {
    throw new RtdnParserError("Missing Pub/Sub body")
  }

  const envelope = body as PubSubPushMessage

  if (!envelope.message?.data) {
    throw new RtdnParserError("Missing Pub/Sub message data")
  }

  let decodedRaw: string

  try {
    decodedRaw = Buffer.from(envelope.message.data, "base64").toString("utf8")
  } catch {
    throw new RtdnParserError("Failed to decode base64 data")
  }

  let decodedJson: GooglePlayRtdnPayload

  try {
    decodedJson = JSON.parse(decodedRaw)
  } catch {
    throw new RtdnParserError("Invalid JSON in RTDN payload")
  }

  return {
    pubsubMessageId: envelope.message.messageId ?? null,
    pubsubPublishTime: envelope.message.publishTime ?? null,
    subscription: envelope.subscription ?? null,
    rawData: decodedRaw,
    decodedJson
  }
}

export function validateRtdnPayload(payload: GooglePlayRtdnPayload): void {
  if (!payload.packageName) {
    throw new RtdnParserError("Missing packageName")
  }

  if (!payload.eventTimeMillis) {
    throw new RtdnParserError("Missing eventTimeMillis")
  }

  const hasAny =
    payload.subscriptionNotification ||
    payload.oneTimeProductNotification ||
    payload.voidedPurchaseNotification ||
    payload.testNotification

  if (!hasAny) {
    throw new RtdnParserError("No valid notification type in RTDN")
  }
}

export function extractRtdnSummary(payload: GooglePlayRtdnPayload) {
  if (payload.subscriptionNotification) {
    const type = payload.subscriptionNotification.notificationType

    return {
      notificationKind: "subscription",
      notificationType: type ?? null,
      notificationTypeName: getSubscriptionNotificationTypeName(type),
      handledByCurrentImplementation: HANDLED_SUBSCRIPTION_NOTIFICATION_TYPES.has(type ?? -1),
      packageName: payload.packageName ?? null,
      productId: payload.subscriptionNotification.subscriptionId ?? null,
      purchaseToken: payload.subscriptionNotification.purchaseToken ?? null
    }
  }

  if (payload.oneTimeProductNotification) {
    return {
      notificationKind: "one_time",
      notificationType: payload.oneTimeProductNotification.notificationType ?? null,
      notificationTypeName: "ONE_TIME",
      handledByCurrentImplementation: false,
      packageName: payload.packageName ?? null,
      productId: payload.oneTimeProductNotification.sku ?? null,
      purchaseToken: payload.oneTimeProductNotification.purchaseToken ?? null
    }
  }

  if (payload.voidedPurchaseNotification) {
    return {
      notificationKind: "voided",
      notificationType: null,
      notificationTypeName: "VOIDED",
      handledByCurrentImplementation: false,
      packageName: payload.packageName ?? null,
      productId: null,
      purchaseToken: payload.voidedPurchaseNotification.purchaseToken ?? null
    }
  }

  return {
    notificationKind: "test",
    notificationType: null,
    notificationTypeName: "TEST",
    handledByCurrentImplementation: false,
    packageName: payload.packageName ?? null,
    productId: null,
    purchaseToken: null
  }
}