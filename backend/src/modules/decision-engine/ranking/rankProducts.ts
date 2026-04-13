import { Product } from "../types"
import { scoreProduct } from "../scoring/scoreProduct"

export function rankProducts(products: Product[], intent: string[]) {
  return products
    .map(p => ({
      ...p,
      score: scoreProduct(p, intent)
    }))
    .sort((a, b) => b.score - a.score)
}