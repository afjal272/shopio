import { parseQuery } from "./parser/queryParser"
import { applyFilters } from "./filters/applyFilters"
import { rankProducts } from "./ranking/rankProducts"
import { generateExplanation } from "./explanation/generateExplanation"
import { Product } from "./types"

export function runEngine(query: string, products: Product[]) {
  const parsed = parseQuery(query)

  const filtered = applyFilters(products, parsed)

  const ranked = rankProducts(
    filtered,
    parsed.intent,
    parsed.budget
  )

  // ✅ SAFE BEST
  const best = ranked.length > 0 ? ranked[0] : null

  // 🔥 EMPTY CASE (FULLY SAFE)
  if (!best || ranked.length === 0) {
    return {
      best: {
        title: "No suitable product found",
        score: 0,
        confidence: 0,
        explanation: "No products match your budget or requirements"
      },
      top3: [],
      parsed
    }
  }

  return {
    // ✅ BEST (fully enriched)
    best: {
      ...best,
      explanation: generateExplanation(best, parsed.intent),
      confidence: Math.min(100, Math.round(best.score))
    },

    // ✅ TOP 3 (safe + enriched)
    top3: ranked.slice(0, 3).map((p) => ({
      ...p,
      explanation: generateExplanation(p, parsed.intent),
      confidence: Math.min(100, Math.round(p.score))
    })),

    parsed
  }
}