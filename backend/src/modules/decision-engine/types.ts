// 🔥 INTENT TYPE (CORE FIX)
export type IntentType = "gaming" | "camera" | "battery" | "balanced"

// 🔥 CATEGORY TYPE (NEW)
export type CategoryType = "smartphone"

// 🔥 PARSED QUERY
export type ParsedQuery = {
  category: CategoryType | null
  budget: number | null
  intent: IntentType[]
}

// 🔥 PRODUCT TYPE
export type Product = {
  id: string
  title: string
  price: number
  rating: number

  specs: {
    ram?: number
    battery?: number
    processorScore?: number
  }

  tags: string[]
  image?: string

  // 🔥 NEW: BRAND (IMPORTANT FOR SCORING)
  brand?: string

  // 🔥 TRUST SIGNAL
  reviewsCount?: number

  // 🔥 ENGINE OUTPUT (runtime fields)
  score?: number
  breakdown?: {
    ram: number
    processor: number
    battery: number
    rating: number
  }

  explanation?: string
  confidence?: number
}