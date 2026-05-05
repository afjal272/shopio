export type Parsed = {
  intent: string[]
  budget: number | null

  category?: string | null
  constraints?: {
    minRam?: number | null
    minBattery?: number | null
    minRating?: number | null
  }
}

export type Breakdown = {
  ram?: number
  processor?: number
  battery?: number
  rating?: number
}

export type Specs = {
  ram?: number
  battery?: number
  processorScore?: number
}

export type ProductItem = {
  id: string
  name: string
  price: number

  images?: string[]

  score: number
  confidence?: number

  explanation?: string
  tags?: string[]

  breakdown?: Breakdown

  specs?: Specs

  rating?: number
  reviewsCount?: number
}
export type NotRecommendedItem = {
  id: string
  name: string
  reason: string
}

export type SearchResponse = {
  best: ProductItem
  top3: ProductItem[]
  notRecommended: NotRecommendedItem[]
  comparison: string[]
  parsed: Parsed
  suggestions?: string[]

  isRelaxed?: boolean
}

//
// 🔥 ADD THIS (IMPORTANT FIX)
//
export type Product = ProductItem