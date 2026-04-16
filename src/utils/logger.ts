// File: src/utils/logger.ts

type LogMeta = Record<string, unknown>

function log(level: "INFO" | "WARN" | "ERROR", message: string, meta?: LogMeta): void {
  const entry = {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...(meta ?? {})
  }

  if (level === "ERROR") {
    console.error(JSON.stringify(entry))
    return
  }

  console.log(JSON.stringify(entry))
}

export const logger = {
  info: (message: string, meta?: LogMeta) => log("INFO", message, meta),
  warn: (message: string, meta?: LogMeta) => log("WARN", message, meta),
  error: (message: string, meta?: LogMeta) => log("ERROR", message, meta)
}