// =======================================
// Intent Types
// =======================================

export type IntentType =
  | "gaming"
  | "camera"
  | "battery"
  | "balanced"

// =======================================
// Product Categories
// =======================================

export type CategoryType =
  | "smartphone"
  | "laptop"
  | "general"

// =======================================
// Search Constraints
// =======================================

export interface Constraints {
  minRam?: number
  minBattery?: number
  minRating?: number
}

// =======================================
// Weighted Intent
// =======================================

export interface WeightedIntent {
  type: IntentType
  weight: number
}

// =======================================
// Parsed Search Query
// =======================================

export interface ParsedQuery {
  category: CategoryType | null

  budget: number | null

  // Default detected intent
  intent: IntentType[]

  // AI weighted intent
  weightedIntent?: WeightedIntent[]

  // Negative preferences
  negativeIntent?: IntentType[]

  // Search constraints
  constraints?: Constraints
}

// =======================================
// Product Specifications
// =======================================

export interface ProductSpecs {
  ram?: number
  battery?: number
  processorScore?: number

  [key: string]: unknown
}

// =======================================
// Score Breakdown
// =======================================

export interface Breakdown {
  ram: number
  processor: number
  battery: number
  rating: number
}

// =======================================
// Decision Engine Product
// NOTE:
// This is the ENGINE MODEL.
// It is intentionally separate from the Prisma Product model.
// A mapper will convert Database Product -> Engine Product.
// =======================================

export interface Product {
  id: string

  name: string

  brand: string

  category: CategoryType

  description: string

  price: number
  rating: number
  reviewsCount: number

  images: string[]

  tags: string[]
  highlights: string[]
  weaknesses: string[]

  specs: ProductSpecs

  score?: number
  breakdown?: Breakdown
  explanation?: string
  confidence?: number
}