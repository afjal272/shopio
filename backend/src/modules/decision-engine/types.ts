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
}