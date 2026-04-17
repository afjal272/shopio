import { Product } from "../types"

export function getRejectionReason(
  product: Product,
  intent: string[],
  budget: number | null
) {
  const ram = product.specs.ram || 0
  const battery = product.specs.battery || 0
  const processor = product.specs.processorScore || 0

  if (budget && product.price > budget) {
    return `Above your budget`
  }

  if (intent.includes("gaming") && ram < 6) {
    return `Not suitable for gaming due to low RAM (${ram}GB)`
  }

  if (intent.includes("battery") && battery < 5000) {
    return `Battery capacity is lower than expected (${battery}mAh)`
  }

  if (intent.includes("camera") && product.rating < 4.2) {
    return `Camera performance is average`
  }

  return `Less optimal compared to top choices`
}