import { Product, IntentType } from "../types"
import { scoreProduct } from "../scoring/scoreProduct"

export function rankProducts(
  products: Product[],
  intent: IntentType[],   // ✅ FIXED
  budget: number | null
) {
  return products
    .map((p) => {
      const result = scoreProduct(p, intent, budget)

      return {
        ...p,
        score: result.total,
        breakdown: result.breakdown
      }
    })
    .sort((a, b) => {
      // 🔥 1. PRIMARY: SCORE
      if ((b.score ?? 0) !== (a.score ?? 0)) {
        return (b.score ?? 0) - (a.score ?? 0)
      }

      // 🔥 2. TRUST (reviews)
      const reviewsA = a.reviewsCount || 0
      const reviewsB = b.reviewsCount || 0

      if (reviewsB !== reviewsA) {
        return reviewsB - reviewsA
      }

      // 🔥 3. RATING
      if (b.rating !== a.rating) {
        return b.rating - a.rating
      }

      // 🔥 4. VALUE FOR MONEY
      return a.price - b.price
    })
}