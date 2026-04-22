// 🔥 INTENT TYPE (CORE FIX)
export type IntentType = "gaming" | "camera" | "battery" | "balanced"

// 🔥 CATEGORY TYPE (UPGRADED)
export type CategoryType = "smartphone" | "laptop" | "general"

// 🔥 PARSED QUERY (FULL ENGINE SUPPORT)
export type ParsedQuery = {
  category: CategoryType | null
  budget: number | null

  // OLD SYSTEM (keep)
  intent: IntentType[]

  // 🔥 NEW SYSTEM (used by engine)
  weightedIntent?: { type: IntentType; weight: number }[]

  // 🔥 NEGATIVE INTENT
  negativeIntent?: IntentType[]

  // 🔥 CONSTRAINTS (CORE FEATURE)
  constraints?: {
    minRam?: number | null
    minBattery?: number | null
    minRating?: number | null
  }
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

  // 🔥 CATEGORY (required for filtering)
  category?: CategoryType

  // 🔥 BRAND (IMPORTANT FOR SCORING)
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