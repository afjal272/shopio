const FALLBACK_API_URL = "http://localhost:5000"

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.trim() ||
  FALLBACK_API_URL