import { Product } from "../types"
import { scoreProduct } from "../scoring/scoreProduct"

export function rankProducts(
  products: Product[],
  intent: string[],
  budget: number | null
) {
  return products
    .map((p) => {
      const result = scoreProduct(p, intent, budget)

      return {
        ...p,
        score: result.total,        // ✅ FIX
        breakdown: result.breakdown // ✅ NEW
      }
    })
    .sort((a, b) => {
      if (b.score === a.score) {
        return b.rating - a.rating
      }
      return b.score - a.score
    })
}