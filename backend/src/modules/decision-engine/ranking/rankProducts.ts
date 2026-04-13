import { Product } from "../types"
import { scoreProduct } from "../scoring/scoreProduct"

export function rankProducts(
  products: Product[],
  intent: string[],
  budget: number | null
) {
  return products
    .map(p => ({
      ...p,
      score: scoreProduct(p, intent, budget)
    }))
    .sort((a, b) => b.score - a.score)
}