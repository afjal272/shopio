export type ParsedQuery = {
  category: string | null
  budget: number | null
  intent: string[]
}

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

  // 🔥 TRUST SIGNAL (IMPORTANT)
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