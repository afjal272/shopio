import { Product } from "../types"

export function scoreProduct(product: Product, intent: string[]) {
  let score = 0

  if (intent.includes("gaming")) {
    score += (product.specs.ram || 0) * 2
    score += (product.specs.processorScore || 0) * 3
  }

  score += product.rating * 10

  return score
}