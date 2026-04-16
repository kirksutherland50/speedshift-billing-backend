// File: src/config/env.ts

function requireEnv(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback

  if (!value || value.trim() === "") {
    throw new Error(`Missing required environment variable: ${name}`)
  }

  return value
}

function optionalEnv(name: string, fallback?: string): string | undefined {
  const value = process.env[name] ?? fallback
  return value?.trim() ? value : undefined
}

export const env = {
  nodeEnv: requireEnv("NODE_ENV", "development"),
  port: Number(requireEnv("PORT", "8080")),
  googleCloudProject: requireEnv("GOOGLE_CLOUD_PROJECT", "speedshift-493423"),
  firestoreDatabaseId: requireEnv("FIRESTORE_DATABASE_ID", "speedshift"),
  appPackageName: requireEnv("APP_PACKAGE_NAME", "com.speedshift.app"),
  logLevel: optionalEnv("LOG_LEVEL", "info") ?? "info"
}