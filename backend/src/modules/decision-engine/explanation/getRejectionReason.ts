import { Product, IntentType } from "../types"

export function getRejectionReason(
  product: Product,
  intent: IntentType[],
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
    reasons.push(`price (₹${product.price}) is above your budget`)
  }

  // 🎮 GAMING
  if (intent.includes("gaming")) {
    if (ram < 6) {
      reasons.push(`${ram}GB RAM is not enough for smooth gaming`)
    }
    if (processor < 6) {
      reasons.push(`processor (${processor}/10) may struggle with heavy games`)
    }
  }

  // 🔋 BATTERY
  if (intent.includes("battery") && battery < 5000) {
    reasons.push(`${battery}mAh battery may not last long under heavy use`)
  }

  // 📸 CAMERA
  if (intent.includes("camera") && rating < 4.2) {
    reasons.push(`camera performance is average (${rating}⭐ rating)`)
  }

  // 🔥 TRUST (improved logic)
  if (reviews < 300) {
    reasons.push(`low user confidence (${reviews} reviews)`)
  } else if (reviews < 1000) {
    reasons.push(`limited user feedback compared to top options`)
  }

  // 🔥 FALLBACK (smarter)
  if (reasons.length === 0) {
    return `outperformed by higher-ranked products in overall performance`
  }

  return reasons.slice(0, 2).join(", ")
}