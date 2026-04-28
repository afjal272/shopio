// 🔥 INTENT TYPE (CORE FIX)
export type IntentType = "gaming" | "camera" | "battery" | "balanced"

// 🔥 CATEGORY TYPE (UPGRADED)
export type CategoryType = "smartphone" | "laptop" | "general"

// 🔥 CONSTRAINT TYPE (NEW - CLEAN STRUCTURE)
export type Constraints = {
  minRam?: number | null
  minBattery?: number | null
  minRating?: number | null
}

// 🔥 WEIGHTED INTENT (NEW - TYPE SAFETY)
export type WeightedIntent = {
  type: IntentType
  weight: number
}

// 🔥 PARSED QUERY (FULL ENGINE SUPPORT)
export type ParsedQuery = {
  category: CategoryType | null
  budget: number | null

  // OLD SYSTEM (keep)
  intent: IntentType[]

  // 🔥 NEW SYSTEM (used by engine)
  weightedIntent?: WeightedIntent[]

  // 🔥 NEGATIVE INTENT
  negativeIntent?: IntentType[]

  // 🔥 CONSTRAINTS (CORE FEATURE)
  constraints?: Constraints
}

// 🔥 PRODUCT SPECS (NEW - SAFE STRUCTURE)
export type ProductSpecs = {
  ram?: number
  battery?: number
  processorScore?: number
}

// 🔥 BREAKDOWN TYPE (STRICT)
export type Breakdown = {
  ram: number
  processor: number
  battery: number
  rating: number
}

// 🔥 PRODUCT TYPE
export type Product = {
  id: string
  title: string
  price: number
  rating: number

  specs: ProductSpecs

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

  breakdown?: Breakdown

  explanation?: string
  confidence?: number
}