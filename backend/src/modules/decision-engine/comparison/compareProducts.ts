import { Product, IntentType } from "../types"

export function compareProducts(
  a: Product,
  b: Product,
  intent: IntentType[] = ["balanced"]
) {
  const result: string[] = []

  const aRam = a.specs.ram || 0
  const bRam = b.specs.ram || 0

  const aProcessor = a.specs.processorScore || 0
  const bProcessor = b.specs.processorScore || 0

  const aBattery = a.specs.battery || 0
  const bBattery = b.specs.battery || 0

  const aReviews = a.reviewsCount || 0
  const bReviews = b.reviewsCount || 0

  // 🎮 PRIORITY: GAMING
  if (intent.includes("gaming")) {
    if (aProcessor > bProcessor) {
      result.push(`${a.title} delivers smoother gaming due to a stronger processor`)
    }

    if (aRam > bRam) {
      result.push(`${a.title} handles multitasking better with ${aRam}GB RAM`)
    }
  }

  // 🔋 PRIORITY: BATTERY
  if (intent.includes("battery") && aBattery > bBattery) {
    result.push(`${a.title} lasts longer with its ${aBattery}mAh battery`)
  }

  // 📸 PRIORITY: CAMERA
  if (intent.includes("camera") && a.rating > b.rating) {
    result.push(`${a.title} captures better photos based on higher user ratings`)
  }

  // 🔥 TRUST
  if (aReviews > bReviews) {
    result.push(`${a.title} is more trusted with significantly more user reviews`)
  }

  // 🔥 VALUE (IMPROVED)
  const aValue = (aProcessor * 2 + aRam) / a.price
  const bValue = (bProcessor * 2 + bRam) / b.price

  if (aValue > bValue) {
    result.push(`${a.title} offers better overall performance for its price`)
  }

  // 🔥 FALLBACK
  if (result.length === 0) {
    result.push(`${a.title} stands out with a more balanced overall experience`)
  }

  return result.slice(0, 3)
}