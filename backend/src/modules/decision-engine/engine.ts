import { parseQuery } from "./parser/queryParser"
import { applyFilters } from "./filters/applyFilters"
import { rankProducts } from "./ranking/rankProducts"
import { generateExplanation } from "./explanation/generateExplanation"
import { Product } from "./types"

export function runEngine(query: string, products: Product[]) {
  const parsed = parseQuery(query)
  const filtered = applyFilters(products, parsed)
  const ranked = rankProducts(filtered, parsed.intent)

  const best = ranked[0]

  return {
    best: {
      ...best,
      explanation: generateExplanation(best, parsed.intent)
    },
    top3: ranked.slice(0, 3),
    parsed
  }
}