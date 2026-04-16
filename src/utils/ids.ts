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

export function createEventId(): string {
  return `evt_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
}