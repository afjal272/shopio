import { parseQuery } from "./parser/queryParser"
import { applyFilters } from "./filters/applyFilters"
import { rankProducts } from "./ranking/rankProducts"
import { generateExplanation } from "./explanation/generateExplanation"
import { Product } from "./types"

export function runEngine(query: string, products: Product[]) {
  const parsed = parseQuery(query)

  const filtered = applyFilters(products, parsed)

  // 🔥 FIX: budget pass karo
  const ranked = rankProducts(
    filtered,
    parsed.intent,
    parsed.budget
  )

  const best = ranked[0]

  // 🔥 safety (empty result case)
  if (!best) {
    return {
      best: null,
      top3: [],
      parsed
    }
  }

  return {
    best: {
      ...best,
      explanation: generateExplanation(best, parsed.intent)
    },
    top3: ranked.slice(0, 3),
    parsed
  }
}