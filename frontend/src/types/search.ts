export type Parsed = {
  intent: string[]
  budget: number | null

  category?: string | null

  constraints?: {
    minRam?: number
    minBattery?: number
    minRating?: number
  }
}

export type Breakdown = {
  ram?: number
  processor?: number
  battery?: number
  rating?: number
  trust?: number
  value?: number
  priceFit?: number
  constraints?: number
  tieBreaker?: number
  total?: number
}

export type Specs = {
  ram?: number
  battery?: number
  processorScore?: number
}

export type ProductItem = {
  id: string

  name: string

  brand?: string

  category?: string

  description?: string

  price: number

  images?: string[]

  score: number

  confidence?: number

  explanation?: string

  tags?: string[]

  highlights?: string[]

  weaknesses?: string[]

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

export type SuggestionItem = {
  id: string

  category: string

  priority: string

  title: string

  description: string

  confidence: number

  impactScore: number

  action?: string
}

export type SearchResponse = {
  best: ProductItem | null

  recommendations: ProductItem[]

  notRecommended: NotRecommendedItem[]

  comparison: string[]

  parsed: Parsed

  suggestions: SuggestionItem[]

  isRelaxed: boolean
}

export type Product = ProductItem