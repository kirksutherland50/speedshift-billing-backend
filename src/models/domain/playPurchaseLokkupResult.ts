// File: src/models/domain/playPurchaseLookupResult.ts

export type PlayPurchaseLookupResult =
  | {
      appUserId: string
      productType: "SUBSCRIPTION"
      packageName: string
      productId: string
      purchaseToken: string
      raw: unknown
    }
  | {
      appUserId: string
      productType: "ONE_TIME"
      packageName: string
      productId: string
      purchaseToken: string
      raw: unknown
    }