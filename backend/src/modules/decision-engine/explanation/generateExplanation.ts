import { Product } from "../types"

export function generateExplanation(product: Product, intent: string[]) {
  if (intent.includes("gaming")) {
    return `Best for gaming due to ${product.specs.ram}GB RAM and strong processor performance`
  }

  if (intent.includes("camera")) {
    return `Good camera performance with solid user rating of ${product.rating}`
  }

  return "Balanced overall performance"
}