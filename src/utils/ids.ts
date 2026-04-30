// File: src/utils/ids.ts

import { PurchaseProductType } from "../models/domain/purchase"

export function buildPurchaseKey(args: {
  packageName: string
  productType: PurchaseProductType
  purchaseToken: string
}): string {
  return `google_play:${args.packageName}:${args.productType}:${args.purchaseToken}`
}

export function buildVerifyIdempotencyKey(args: {
  packageName: string
  productType: PurchaseProductType
  purchaseToken: string
  appUserId: string
}): string {
  return `verify:${args.packageName}:${args.productType}:${args.purchaseToken}:${args.appUserId}`
}

export function buildRtdnReceivedIdempotencyKey(args: {
  packageName: string
  notificationKind: string
  notificationType: number | null
  productId: string | null
  purchaseToken: string | null
  eventTimeMillis: string
}): string {
  return [
    "rtdn_received",
    args.packageName,
    args.notificationKind,
    args.notificationType ?? "none",
    args.productId ?? "none",
    args.purchaseToken ?? "none",
    args.eventTimeMillis
  ].join(":")
}

export function buildRtdnApplyIdempotencyKey(args: {
  packageName: string
  productId: string
  purchaseToken: string
  notificationType: number | null
  eventTimeMillis: string
}): string {
  return [
    "rtdn_apply",
    args.packageName,
    args.productId,
    args.purchaseToken,
    args.notificationType ?? "none",
    args.eventTimeMillis
  ].join(":")
}

export function createEventId(): string {
  return `evt_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
}