import { Product, ParsedQuery } from "../types"

export function applyFilters(products: Product[], parsed: ParsedQuery) {
  return products.filter(p => {
    if (parsed.budget && p.price > parsed.budget) return false
    return true
  })
}