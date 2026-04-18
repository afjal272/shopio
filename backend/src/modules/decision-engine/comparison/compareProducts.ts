import { Product } from "../types"

export function compareProducts(a: Product, b: Product) {
  const result: string[] = []

  const aRam = a.specs.ram || 0
  const bRam = b.specs.ram || 0

  const aProcessor = a.specs.processorScore || 0
  const bProcessor = b.specs.processorScore || 0

  const aBattery = a.specs.battery || 0
  const bBattery = b.specs.battery || 0

  const aReviews = a.reviewsCount || 0
  const bReviews = b.reviewsCount || 0

  // 🔥 RAM
  if (aRam > bRam) {
    result.push(`${a.title} offers better multitasking with ${aRam}GB RAM vs ${bRam}GB`)
  }

  // 🔥 PROCESSOR
  if (aProcessor > bProcessor) {
    result.push(`${a.title} has a stronger processor (${aProcessor}/10 vs ${bProcessor}/10)`)
  }

  // 🔥 BATTERY
  if (aBattery > bBattery) {
    result.push(`${a.title} provides longer battery life (${aBattery}mAh vs ${bBattery}mAh)`)
  }

  // 🔥 RATING
  if (a.rating > b.rating) {
    result.push(`${a.title} is rated higher by users (${a.rating}⭐ vs ${b.rating}⭐)`)
  }

  // 🔥 TRUST (REVIEWS)
  if (aReviews > bReviews) {
    result.push(`${a.title} is more trusted with ${aReviews}+ reviews`)
  }

  // 🔥 VALUE FOR MONEY
  const aValue = (aProcessor + aRam) / a.price
  const bValue = (bProcessor + bRam) / b.price

  if (aValue > bValue) {
    result.push(`${a.title} offers better value for money`)
  }

  // 🔥 FALLBACK (VERY IMPORTANT)
  if (result.length === 0) {
    result.push(`${a.title} performs similarly but is still a solid overall choice`)
  }

  // 🔥 LIMIT (clean output)
  return result.slice(0, 3)
}