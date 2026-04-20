import { Product, IntentType } from "../types"
import { scoreProduct } from "../scoring/scoreProduct"

export function rankProducts(
  products: Product[],
  intent: IntentType[],
  budget: number | null
) {
  return products
    .map((p) => {
      const result = scoreProduct(p, intent, budget)

      return {
        ...p,
        score: result.total ?? 0, // 🔥 guarantee
        breakdown: result.breakdown
      }
    })
    .sort((a, b) => {
      const scoreA = a.score ?? 0
      const scoreB = b.score ?? 0

      // 🔥 1. SCORE
      if (scoreB !== scoreA) {
        return scoreB - scoreA
      }

      // 🔥 2. TRUST
      const reviewsA = a.reviewsCount ?? 0
      const reviewsB = b.reviewsCount ?? 0

      if (reviewsB !== reviewsA) {
        return reviewsB - reviewsA
      }

      // 🔥 3. RATING
      if (b.rating !== a.rating) {
        return b.rating - a.rating
      }

      // 🔥 4. PRICE (value)
      return a.price - b.price
    })
}