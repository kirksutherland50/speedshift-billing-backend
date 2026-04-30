export interface PubSubPushMessage {
  message: {
    data?: string
    messageId?: string
    publishTime?: string
  }
  subscription?: string
}

export interface GooglePlayRtdnPayload {
  version?: string
  packageName?: string
  eventTimeMillis?: string

  subscriptionNotification?: {
    version?: string
    notificationType?: number
    purchaseToken?: string
    subscriptionId?: string
  }

  oneTimeProductNotification?: {
    version?: string
    notificationType?: number
    purchaseToken?: string
    sku?: string
  }

  voidedPurchaseNotification?: {
    purchaseToken?: string
    orderId?: string
  }

  testNotification?: {
    version?: string
  }
}

export interface ParsedRtdnMessage {
  pubsubMessageId: string | null
  pubsubPublishTime: string | null
  subscription: string | null
  rawData: string
  decodedJson: GooglePlayRtdnPayload
}