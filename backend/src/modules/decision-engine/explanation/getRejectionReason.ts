import { Product } from "../types"

export function getRejectionReason(
  product: Product,
  intent: string[],
  budget: number | null
) {
  const ram = product.specs.ram || 0
  const battery = product.specs.battery || 0
  const processor = product.specs.processorScore || 0
  const rating = product.rating
  const reviews = product.reviewsCount || 0

  const reasons: string[] = []

  // 💰 BUDGET
  if (budget && product.price > budget) {
    reasons.push(`price exceeds your budget (₹${product.price})`)
  }

  // 🎮 GAMING
  if (intent.includes("gaming")) {
    if (ram < 6) {
      reasons.push(`low RAM (${ram}GB) for gaming`)
    }
    if (processor < 6) {
      reasons.push(`weak processor (${processor}/10)`)
    }
  }

  // 🔋 BATTERY
  if (intent.includes("battery") && battery < 5000) {
    reasons.push(`battery is lower (${battery}mAh)`)
  }

  // 📸 CAMERA
  if (intent.includes("camera") && rating < 4.2) {
    reasons.push(`average camera performance (${rating}⭐)`)
  }

  // 🔥 TRUST
  if (reviews < 200) {
    reasons.push(`low user trust (${reviews} reviews)`)
  }

  // 🔥 FALLBACK
  if (reasons.length === 0) {
    return `Less competitive compared to better-ranked options`
  }

  // 🔥 CLEAN OUTPUT (max 2 reasons)
  return reasons.slice(0, 2).join(", ")
}