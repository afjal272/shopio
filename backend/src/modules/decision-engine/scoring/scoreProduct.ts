import { Product } from "../types"

export function scoreProduct(product: Product, intent: string[]) {
  let score = 0

  intent.forEach(i => {
    if (i === "gaming") {
      score += (product.specs.ram || 0) * 3
      score += (product.specs.processorScore || 0) * 4
      score += (product.specs.battery || 0) / 1000
    }

    if (i === "camera") {
      score += product.rating * 5
    }
  })

  // base trust factor
  score += product.rating * 10

  return score
}