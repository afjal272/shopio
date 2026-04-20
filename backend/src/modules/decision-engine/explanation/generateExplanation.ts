import { Product, IntentType } from "../types"

export function generateExplanation(product: Product, intent: IntentType[]) {
  const ram = product.specs.ram || 0
  const battery = product.specs.battery || 0
  const processor = product.specs.processorScore || 0
  const rating = product.rating
  const reviews = product.reviewsCount || 0

  let reasons: string[] = []

  // 🎮 GAMING
  if (intent.includes("gaming")) {
    if (ram >= 8) {
      reasons.push(`${ram}GB RAM handles heavy gaming smoothly`)
    } else {
      reasons.push(`${ram}GB RAM suits casual gaming`)
    }

    if (processor >= 8) {
      reasons.push(`powerful processor (${processor}/10) ensures stable performance`)
    } else {
      reasons.push(`decent processor (${processor}/10) for normal usage`)
    }
  }

  // 📸 CAMERA
  if (intent.includes("camera")) {
    reasons.push(`${rating}⭐ rating reflects reliable camera output`)

    if (product.tags.includes("camera")) {
      reasons.push(`camera-focused optimization`)
    }
  }

  // 🔋 BATTERY
  if (intent.includes("battery")) {
    if (battery >= 6000) {
      reasons.push(`${battery}mAh battery easily lasts a full day+`)
    } else {
      reasons.push(`${battery}mAh battery handles daily usage comfortably`)
    }
  }

  // ⚖️ BALANCED (only if nothing added)
  if (intent.includes("balanced") && reasons.length === 0) {
    reasons.push(`${ram}GB RAM with balanced performance`)
    reasons.push(`${battery}mAh battery for regular usage`)
    reasons.push(`${rating}⭐ overall user rating`)
  }

  // 🔥 TRUST SIGNAL
  if (reviews > 0) {
    reasons.push(`${reviews}+ user reviews build trust`)
  }

  // 🔥 SAFETY
  if (reasons.length === 0) {
    reasons.push(`balanced specifications for everyday use`)
  }

  // 🔥 SMART TITLE LINE (not generic)
  const intentText =
    intent.length > 1
      ? intent.join(" & ")
      : intent[0] || "general use"

  return `${product.title} fits ${intentText} needs because it offers ${reasons.join(", ")}.`
}