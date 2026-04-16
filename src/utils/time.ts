// File: src/utils/time.ts

export function nowIso(): string {
  return new Date().toISOString()
}

export function toIsoOrNull(value: string | null | undefined): string | null {
  if (!value) {
    return null
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return null
  }

  return date.toISOString()
}

export function epochMillisToIsoOrNull(value: number | string | null | undefined): string | null {
  if (value === null || value === undefined) {
    return null
  }

  const millis = typeof value === "string" ? Number(value) : value

  if (!Number.isFinite(millis)) {
    return null
  }

  const date = new Date(millis)

  if (Number.isNaN(date.getTime())) {
    return null
  }

  return date.toISOString()
}

export function isFutureIso(value: string | null | undefined, now: Date = new Date()): boolean {
  if (!value) {
    return false
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return false
  }

  return date.getTime() > now.getTime()
}