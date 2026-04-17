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

  if (!best || ranked.length === 0) {
    return {
      best: {
        title: "No suitable product found",
        score: 0,
        confidence: 0,
        explanation: "No products match your budget or requirements"
      },
      top3: [],
      notRecommended: [],
      comparison: [], // 🔥 add this
      parsed
    }
  }

  return {
    // ✅ BEST
    best: {
      ...best,
      explanation: generateExplanation(best, parsed.intent),
      confidence: Math.min(100, Math.round(best.score))
    },

    // ✅ TOP 3
    top3: ranked.slice(0, 3).map((p) => ({
      ...p,
      explanation: generateExplanation(p, parsed.intent),
      confidence: Math.min(100, Math.round(p.score))
    })),

    // ✅ NOT RECOMMENDED
    notRecommended: ranked.slice(3, 6).map((p) => ({
      ...p,
      reason: getRejectionReason(p, parsed.intent, parsed.budget)
    })),

    // 🔥 NEW: COMPARISON (YOU MISSED THIS)
    comparison:
      ranked.length > 1
        ? compareProducts(ranked[0], ranked[1])
        : [],

    parsed
  }
}