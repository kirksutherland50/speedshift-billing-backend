// File: src/models/api/playLookupRequest.ts

import { z } from "zod"

export const playLookupRequestSchema = z.object({
  packageName: z.string().min(1),
  productType: z.enum(["SUBSCRIPTION", "ONE_TIME"]),
  productId: z.string().min(1),
  purchaseToken: z.string().min(1)
})

export type PlayLookupRequest = z.infer<typeof playLookupRequestSchema>