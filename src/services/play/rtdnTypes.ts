export const HANDLED_SUBSCRIPTION_NOTIFICATION_TYPES = new Set<number>([
  4, // PURCHASED
  2, // RENEWED
  3, // CANCELED
  6, // GRACE
  5, // ON HOLD
  1, // RECOVERED
  12, // REVOKED
  13 // EXPIRED
])

export function getSubscriptionNotificationTypeName(type?: number): string {
  switch (type) {
    case 1: return "SUBSCRIPTION_RECOVERED"
    case 2: return "SUBSCRIPTION_RENEWED"
    case 3: return "SUBSCRIPTION_CANCELED"
    case 4: return "SUBSCRIPTION_PURCHASED"
    case 5: return "SUBSCRIPTION_ON_HOLD"
    case 6: return "SUBSCRIPTION_IN_GRACE_PERIOD"
    case 12: return "SUBSCRIPTION_REVOKED"
    case 13: return "SUBSCRIPTION_EXPIRED"
    default: return "UNKNOWN"
  }
}