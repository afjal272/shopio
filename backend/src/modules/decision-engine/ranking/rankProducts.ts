import { Product, IntentType } from "../types"
import { scoreProduct } from "../scoring/scoreProduct"

export function rankProducts(
  products: Product[],
  intent: IntentType[] | { type: IntentType; weight: number }[],
  budget: number | null,
  constraints?: {
    minRam?: number | null
    minBattery?: number | null
    minRating?: number | null
  }
) {
  return products
    .map((p) => {
      // 🔥 FIX: pass constraints to scoring
      const result = scoreProduct(p, intent, budget, constraints)

      return {
        ...p,
        score: result.total ?? 0,
        breakdown: result.breakdown
      }
    })
    .sort((a, b) => {
      const scoreA = a.score ?? 0
      const scoreB = b.score ?? 0

      // 🔥 1. SCORE (main driver)
      if (scoreB !== scoreA) {
        return scoreB - scoreA
      }

      // 🔥 2. TRUST (reviews count)
      const reviewsA = a.reviewsCount ?? 0
      const reviewsB = b.reviewsCount ?? 0

      if (reviewsB !== reviewsA) {
        return reviewsB - reviewsA
      }

      // 🔥 3. RATING
      if ((b.rating ?? 0) !== (a.rating ?? 0)) {
        return (b.rating ?? 0) - (a.rating ?? 0)
      }

      // 🔥 4. PRICE (cheaper wins tie)
      return (a.price ?? 0) - (b.price ?? 0)
    })
}