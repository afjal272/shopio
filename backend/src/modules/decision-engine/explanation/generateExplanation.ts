import { Product } from "../types"

export function generateExplanation(product: Product, intent: string[]) {
  const ram = product.specs.ram || 0
  const battery = product.specs.battery || 0
  const processor = product.specs.processorScore || 0
  const rating = product.rating
  const reviews = product.reviewsCount || 0

  let reasons: string[] = []

  // 🎮 GAMING
  if (intent.includes("gaming")) {
    if (ram >= 8) {
      reasons.push(`${ram}GB RAM ensures smooth gaming`)
    } else {
      reasons.push(`${ram}GB RAM is okay for casual gaming`)
    }

    if (processor >= 8) {
      reasons.push(`strong processor (${processor}/10) for high performance`)
    } else {
      reasons.push(`decent processor (${processor}/10)`)
    }
  }

  // 📸 CAMERA
  if (intent.includes("camera")) {
    reasons.push(`${rating}⭐ rating indicates good camera quality`)

    if (product.tags.includes("camera")) {
      reasons.push(`camera optimized device`)
    }
  }

  // 🔋 BATTERY
  if (intent.includes("battery")) {
    if (battery >= 6000) {
      reasons.push(`${battery}mAh battery gives excellent backup`)
    } else {
      reasons.push(`${battery}mAh battery is decent for daily use`)
    }
  }

  // ⚖️ BALANCED / DEFAULT
  if (intent.includes("balanced")) {
    reasons.push(`${ram}GB RAM`)
    reasons.push(`processor ${processor}/10`)
    reasons.push(`${battery}mAh battery`)
    reasons.push(`${rating}⭐ rating`)
  }

  // 🔥 TRUST SIGNAL
  if (reviews > 0) {
    reasons.push(`${reviews}+ user reviews`)
  }

  // 🔥 SAFETY FALLBACK
  if (reasons.length === 0) {
    reasons.push(`balanced specifications for everyday use`)
  }

  return `${product.title} is a good choice for ${
    intent.join(", ") || "general use"
  } because it offers ${reasons.join(", ")}.`
}