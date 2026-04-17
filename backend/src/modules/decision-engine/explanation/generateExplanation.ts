import { Product } from "../types"

export function generateExplanation(product: Product, intent: string[]) {
  const ram = product.specs.ram || 0
  const battery = product.specs.battery || 0
  const processor = product.specs.processorScore || 0
  const rating = product.rating

  let reasons: string[] = []

  // 🔥 INTENT BASED
  if (intent.includes("gaming")) {
    reasons.push(`${ram}GB RAM for smooth gaming`)
    reasons.push(`powerful processor (${processor}/10)`)
  }

  if (intent.includes("camera")) {
    reasons.push(`high rating (${rating}) for camera quality`)
    if (product.tags.includes("camera")) {
      reasons.push(`optimized camera system`)
    }
  }

  if (intent.includes("battery")) {
    reasons.push(`${battery}mAh battery for long usage`)
  }

  // 🔥 BALANCED (IMPORTANT FIX)
  if (intent.includes("balanced")) {
    reasons.push(`${ram}GB RAM`)
    reasons.push(`${battery}mAh battery`)
    reasons.push(`processor score ${processor}/10`)
    reasons.push(`rating ${rating}`)
  }

  // 🔥 FALLBACK (NO INTENT)
  if (intent.length === 0) {
    reasons.push(`${ram}GB RAM`)
    reasons.push(`${battery}mAh battery`)
    reasons.push(`processor score ${processor}/10`)
    reasons.push(`rating ${rating}`)
  }

  // 🔥 SAFETY (MOST IMPORTANT)
  if (reasons.length === 0) {
    reasons.push(`overall balanced specifications`)
  }

  return `This phone is ideal for ${
    intent.length ? intent.join(" & ") : "general use"
  } because it offers ${reasons.join(", ")}.`
}