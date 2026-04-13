import { Product } from "../modules/decision-engine/types"

export const products: Product[] = [
  {
    id: "1",
    title: "iQOO Z6",
    price: 18000,
    rating: 4.3,
    specs: {
      ram: 8,
      processorScore: 8,
      battery: 5000
    },
    tags: ["gaming"]
  },
  {
    id: "2",
    title: "Redmi Note 12",
    price: 17000,
    rating: 4.2,
    specs: {
      ram: 6,
      processorScore: 7,
      battery: 5000
    },
    tags: []
  }
]