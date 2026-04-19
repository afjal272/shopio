export type Parsed = {
  intent: string[]
  budget: number | null
}

export type Breakdown = {
  ram: number
  processor: number
  battery: number
  rating: number
}

export type ProductItem = {
  id: string
  title: string
  price: number
  image?: string

  score: number
  confidence?: number

  explanation?: string
  tags?: string[]

  breakdown?: Breakdown
}

export type NotRecommendedItem = {
  id: string
  title: string
  reason: string
}

export type SearchResponse = {
  best: ProductItem
  top3: ProductItem[]
  notRecommended: NotRecommendedItem[]
  comparison: string[]
  parsed: Parsed
}