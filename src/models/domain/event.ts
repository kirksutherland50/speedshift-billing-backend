// File: src/models/domain/event.ts

export type EventRecord = {
  eventId: string
  type: "PURCHASE_VERIFIED" | "RTDN_RECEIVED" | "PURCHASE_UPDATED_FROM_RTDN"
  provider: "google_play"
  appUserId: string | null
  purchaseKey: string | null
  requestId: string
  idempotencyKey: string
  source: "api" | "rtdn"
  occurredAt: string
  payload: Record<string, unknown>
}