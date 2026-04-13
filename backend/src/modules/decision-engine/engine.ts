import { parseQuery } from "./parser/queryParser"
import { applyFilters } from "./filters/applyFilters"
import { rankProducts } from "./ranking/rankProducts"
import { Product } from "./types"

export function runEngine(query: string, products: Product[]) {
  const parsed = parseQuery(query)
  const filtered = applyFilters(products, parsed)
  const ranked = rankProducts(filtered, parsed.intent)

  return {
    best: ranked[0],
    top3: ranked.slice(0, 3),
    parsed
  }
}