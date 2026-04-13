import { Product } from "../types"

export function generateExplanation(product: Product, intent: string[]) {
  if (intent.length > 1) {
    return `Balanced for ${intent.join(" & ")} with ${product.specs.ram}GB RAM, ${product.specs.battery}mAh battery and rating ${product.rating}`
  }

  if (intent.includes("gaming")) {
    if ((product.specs.ram || 0) < 6) {
      return `Only suitable for light gaming due to ${product.specs.ram}GB RAM`
    }
    return `Great for gaming with ${product.specs.ram}GB RAM and strong processor`
  }

  if (intent.includes("camera")) {
    return `Strong camera experience backed by ${product.rating} rating and optimized imaging`
  }

  if (intent.includes("battery")) {
    return `Long-lasting battery with ${product.specs.battery}mAh capacity`
  }

  return "Balanced overall performance"
}