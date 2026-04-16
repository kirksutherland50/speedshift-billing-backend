// File: src/models/domain/event.ts

export type EventRecord = {
  eventId: string
  type: "PURCHASE_VERIFIED"
  provider: "google_play"
  appUserId: string
  purchaseKey: string
  requestId: string
  idempotencyKey: string
  source: "api"
  occurredAt: string
  payload: Record<string, unknown>
}