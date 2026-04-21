import { parseQuery } from "./parser/queryParser"
import { applyFilters } from "./filters/applyFilters"
import { rankProducts } from "./ranking/rankProducts"
import { generateExplanation } from "./explanation/generateExplanation"
import { getRejectionReason } from "./explanation/getRejectionReason"
import { compareProducts } from "./comparison/compareProducts"
import { Product } from "./types"

export function runEngine(query: string, products: Product[]) {
  const parsed = parseQuery(query)

  const filtered = applyFilters(products, parsed)

  const ranked = rankProducts(
    filtered,
    parsed.intent,
    parsed.budget
  )

  const best = ranked.length > 0 ? ranked[0] : null

  // SAFETY
  if (!best) {
    return {
      best: {
        id: "none",
        title: "No suitable product found",
        price: 0,
        rating: 0,
        image: "",
        score: 0,
        confidence: 0,
        explanation: "No products match your budget or requirements",
        tags: [],
        breakdown: {
          ram: 0,
          processor: 0,
          battery: 0,
          rating: 0
        }
      },
      top3: [],
      notRecommended: [],
      comparison: [],
      parsed
    }
  }

  // COMPARISON
  const comparison =
    ranked.length > 1
      ? compareProducts(ranked[0], ranked[1], parsed.intent)
      : []

  return {
    // BEST
    best: {
      ...best,
      explanation: generateExplanation(best, parsed.intent),
      confidence: Math.min(100, Math.round(best.score || 0))
    },

    // 🔥 FIXED TOP 3 (no duplicate)
    top3: ranked.slice(1, 4).map((p) => ({
      ...p,
      explanation: generateExplanation(p, parsed.intent),
      confidence: Math.min(100, Math.round(p.score || 0))
    })),

    // NOT RECOMMENDED
    notRecommended: ranked.slice(4, 7).map((p) => ({
      ...p,
      reason: getRejectionReason(p, parsed.intent, parsed.budget)
    })),

    comparison,
    parsed
  }
}