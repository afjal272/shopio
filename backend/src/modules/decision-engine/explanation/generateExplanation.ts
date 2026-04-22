import { Product, IntentType } from "../types"

export function generateExplanation(product: Product, intent: IntentType[]) {
  const ram = product.specs.ram || 0
  const battery = product.specs.battery || 0
  const processor = product.specs.processorScore || 0
  const rating = product.rating || 0
  const reviews = product.reviewsCount || 0
  const tags = product.tags || []

  const reasons: string[] = []

  // 🎮 GAMING
  if (intent.includes("gaming")) {
    if (processor >= 8) {
      reasons.push(`strong processor (${processor}/10) ensures smooth gaming`)
    } else if (processor >= 6) {
      reasons.push(`decent processor (${processor}/10) handles moderate gaming`)
    } else {
      reasons.push(`limited processor performance for heavy gaming`)
    }

    if (ram >= 8) {
      reasons.push(`${ram}GB RAM supports multitasking and gaming`)
    }
  }

  // 📸 CAMERA
  if (intent.includes("camera")) {
    if (rating >= 4.3) {
      reasons.push(`high user rating (${rating}⭐) indicates good camera performance`)
    } else {
      reasons.push(`average rating (${rating}⭐) suggests camera is decent`)
    }

    if (tags.includes("camera")) {
      reasons.push(`optimized for photography`)
    }
  }

  // 🔋 BATTERY
  if (intent.includes("battery")) {
    if (battery >= 6000) {
      reasons.push(`${battery}mAh battery easily lasts more than a day`)
    } else if (battery >= 5000) {
      reasons.push(`${battery}mAh battery is reliable for daily usage`)
    } else {
      reasons.push(`battery life may be average`)
    }
  }

  // ⚖️ BALANCED (fallback)
  if (intent.includes("balanced") && reasons.length === 0) {
    reasons.push(`${ram}GB RAM and stable performance for everyday use`)
    reasons.push(`${battery}mAh battery for regular usage`)
  }

  // 🔥 TRUST SIGNAL (stronger wording)
  if (reviews > 1000) {
    reasons.push(`${reviews}+ reviews indicate strong market trust`)
  } else if (reviews > 100) {
    reasons.push(`${reviews}+ reviews provide reasonable confidence`)
  }

  // 🔥 SAFETY
  if (reasons.length === 0) {
    reasons.push(`balanced specifications for general usage`)
  }

  // 🔥 CLEAN INTENT TEXT
  const intentText =
    intent.length > 1
      ? intent.join(" & ")
      : intent[0] || "general use"

  return `${product.title} is a good fit for ${intentText} because it offers ${reasons.join(", ")}.`
}