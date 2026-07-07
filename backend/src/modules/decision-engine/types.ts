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
  maxRam?: number

  minBattery?: number
  maxBattery?: number

  minRating?: number
  maxRating?: number

  minPrice?: number
  maxPrice?: number

  preferredBrands?: string[]
  excludedBrands?: string[]

  requiredTags?: string[]
  excludedTags?: string[]
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
  // Original user query
  originalQuery?: string

  category: CategoryType | null

  budget: number | null

  // Default detected intents
  intent: IntentType[]

  // AI weighted intents
  weightedIntent?: WeightedIntent[]

  // Negative intents
  negativeIntent?: IntentType[]

  // Search constraints
  constraints?: Constraints
}

// =======================================
// Product Specifications
// =======================================

export interface ProductSpecs {
  ram?: number

  storage?: number

  battery?: number

  processorScore?: number

  displaySize?: number

  refreshRate?: number

  chargingSpeed?: number

  cameraMp?: number

  frontCameraMp?: number

  // Future-ready specs

  chipset?: string

  displayType?: string

  operatingSystem?: string

  fingerprint?: boolean

  waterproof?: boolean

  wirelessCharging?: boolean

  fastCharging?: boolean

  expandableStorage?: boolean

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

  trust?: number

  value?: number

  total?: number
}

// =======================================
// Decision Engine Product
// NOTE:
// This is the ENGINE MODEL.
// It is intentionally separate from the Prisma Product model.
// A mapper converts Database Product -> Engine Product.
// =======================================

export interface Product {
  id: string

  slug?: string

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

  // Engine-generated values

  score?: number

  comparisonScore?: number

  breakdown?: Breakdown

  confidence?: number

  explanation?: string

  rejectionReason?: string

  // Future metadata

  metadata?: Record<string, unknown>
}