import { Product, IntentType } from "../types"

export function getRejectionReason(
  product: Product,
  intent: IntentType[],
  budget: number | null
) {
  const ram = product.specs.ram || 0
  const battery = product.specs.battery || 0
  const processor = product.specs.processorScore || 0
  const rating = product.rating || 0
  const reviews = product.reviewsCount || 0

  const reasons: string[] = []

  // 💰 BUDGET (strong signal)
  if (budget && product.price > budget) {
    reasons.push(`over budget (₹${product.price})`)
  }

  // 🎮 GAMING (strict)
  if (intent.includes("gaming")) {
    if (processor < 6) {
      reasons.push(`weak processor (${processor}/10) for gaming`)
    }
    if (ram < 6) {
      reasons.push(`low RAM (${ram}GB) limits performance`)
    }
  }

  // 🔋 BATTERY
  if (intent.includes("battery")) {
    if (battery < 5000) {
      reasons.push(`battery (${battery}mAh) is below ideal`)
    }
  }

  // 📸 CAMERA
  if (intent.includes("camera")) {
    if (rating < 4.2) {
      reasons.push(`average camera performance (${rating}⭐)`)
    }
  }

  // 🔥 TRUST (more realistic)
  if (reviews < 200) {
    reasons.push(`very low user trust (${reviews} reviews)`)
  } else if (reviews < 800) {
    reasons.push(`less proven than top options`)
  }

  // ⚠️ GENERAL WEAKNESS (catch-all)
  if (!intent.includes("gaming") && processor < 5) {
    reasons.push(`overall performance is below average`)
  }

  // 🔥 FINAL OUTPUT
  if (reasons.length === 0) {
    return `weaker value compared to better-ranked alternatives`
  }

  return reasons.slice(0, 2).join(", ")
}