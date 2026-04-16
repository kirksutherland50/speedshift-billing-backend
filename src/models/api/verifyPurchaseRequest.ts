// File: src/models/api/verifyPurchaseRequest.ts

import { z } from "zod"

export const verifyPurchaseRequestSchema = z.object({
  appUserId: z.string().min(1),
  packageName: z.string().min(1),
  productType: z.enum(["SUBSCRIPTION", "ONE_TIME"]),
  productId: z.string().min(1),
  purchaseToken: z.string().min(1),
  purchaseTimeMillis: z.number().int().nonnegative().optional(),
  obfuscatedExternalAccountId: z.string().min(1).nullable().optional(),
  appVersion: z.string().min(1).optional()
})

export type VerifyPurchaseRequest = z.infer<typeof verifyPurchaseRequestSchema>