// File: src/services/play/playApiClient.ts

import { google, androidpublisher_v3 } from "googleapis"

let publisherClient: androidpublisher_v3.Androidpublisher | null = null

export function getPlayPublisherClient(): androidpublisher_v3.Androidpublisher {
  if (publisherClient) {
    return publisherClient
  }

  const auth = new google.auth.GoogleAuth({
    scopes: ["https://www.googleapis.com/auth/androidpublisher"]
  })

  publisherClient = google.androidpublisher({
    version: "v3",
    auth
  })

  return publisherClient
}