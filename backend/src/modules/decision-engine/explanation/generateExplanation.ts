import { Product } from "../types"

export function generateExplanation(product: Product, intent: string[]) {
  if (intent.includes("gaming")) {
    if ((product.specs.ram || 0) < 6) {
      return `Decent for light gaming but limited by ${product.specs.ram}GB RAM`
    }
    return `Strong gaming performance with ${product.specs.ram}GB RAM and good processor`
  }

  if (intent.includes("camera")) {
    return `Good camera performance with rating ${product.rating}`
  }

  if (intent.includes("battery")) {
    return `Excellent battery backup with ${product.specs.battery}mAh capacity`
  }

  return "Balanced overall performance"
}