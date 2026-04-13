import { Product } from "../types"
import { scoreProduct } from "../scoring/scoreProduct"

export function rankProducts(
  products: Product[],
  intent: string[],
  budget: number | null
) {
  return products
    .map((p) => ({
      ...p,
      score: scoreProduct(p, intent, budget)
    }))
    .sort((a, b) => {
      // 🔥 tie-breaker
      if (b.score === a.score) {
        return b.rating - a.rating
      }
      return b.score - a.score
    })
}