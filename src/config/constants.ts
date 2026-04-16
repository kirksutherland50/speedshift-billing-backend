// File: src/config/constants.ts

export const APP_NAME = "speedshift-billing-backend"

export const COLLECTIONS = {
  users: "users",
  entitlements: "entitlements",
  purchases: "purchases",
  events: "events"
} as const

export const ROUTES = {
  health: "/health",
  healthFirestore: "/health/firestore",
  healthPlay: "/health/play",
  healthRepositories: "/health/repositories",
  playVerifyPurchase: "/play/purchase/verify"
} as const

export const ENTITLEMENT_VERSION = 1

export const PRODUCT_IDS = {
  proMonthly: "speedshift_pro_monthly"
} as const