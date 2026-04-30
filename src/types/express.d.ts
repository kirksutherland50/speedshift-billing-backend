// File: src/types/express.d.ts

declare global {
  namespace Express {
    interface Request {
      appUserId?: string
    }
  }
}

export {}