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

  const aRating = a.rating || 0
  const bRating = b.rating || 0

  const safePriceA = Math.max(a.price || 1, 1)
  const safePriceB = Math.max(b.price || 1, 1)

  // 🔥 NEW: helper (winner bias toward A)
  const pushA = (condition: boolean, text: string) => {
    if (condition) result.push(text)
  }

  // 🎮 GAMING
  if (intent.includes("gaming")) {
    if (aProcessor > bProcessor) {
      result.push(`${a.title} delivers smoother gaming with a stronger processor`)
    } else if (bProcessor > aProcessor) {
      result.push(`${b.title} has better gaming performance due to a stronger processor`)
    }

    if (aRam > bRam) {
      result.push(`${a.title} handles multitasking better with ${aRam}GB RAM`)
    } else if (bRam > aRam) {
      result.push(`${b.title} offers better multitasking with ${bRam}GB RAM`)
    }

    // 🔥 NEW: reinforce A if better
    pushA(
      aProcessor > bProcessor && aRam >= bRam,
      `${a.title} is more optimized overall for gaming performance`
    )
  }

  // 🔋 BATTERY
  if (intent.includes("battery")) {
    if (aBattery > bBattery) {
      result.push(`${a.title} lasts longer with its ${aBattery}mAh battery`)
    } else if (bBattery > aBattery) {
      result.push(`${b.title} provides better battery backup (${bBattery}mAh)`)
    }

    // 🔥 NEW
    pushA(
      aBattery > bBattery,
      `${a.title} offers more reliable all-day battery usage`
    )
  }

  // 📸 CAMERA
  if (intent.includes("camera")) {
    if (aRating > bRating) {
      result.push(`${a.title} offers better camera results based on higher ratings`)
    } else if (bRating > aRating) {
      result.push(`${b.title} delivers better camera performance (${bRating}⭐)`)
    }

    // 🔥 NEW
    pushA(
      aRating > bRating,
      `${a.title} is more consistent for photography overall`
    )
  }

  // 🔥 TRUST (balanced)
  if (Math.abs(aReviews - bReviews) > 300) {
    if (aReviews > bReviews) {
      result.push(`${a.title} is more trusted with significantly more reviews`)
    } else {
      result.push(`${b.title} has stronger market trust with more user feedback`)
    }

    // 🔥 NEW
    pushA(
      aReviews > bReviews,
      `${a.title} has proven reliability with a larger user base`
    )
  }

  // 💰 VALUE (important)
  const aValue = (aProcessor * 2 + aRam) / safePriceA
  const bValue = (bProcessor * 2 + bRam) / safePriceB

  if (aValue > bValue * 1.1) {
    result.push(`${a.title} offers better performance for its price`)
  } else if (bValue > aValue * 1.1) {
    result.push(`${b.title} provides better value for money`)
  }

  // 🔥 NEW: reinforce A if value better
  pushA(
    aValue > bValue,
    `${a.title} stands out as a stronger value overall`
  )

  // ⚖️ TRADE-OFF LINE (existing)
  if (result.length >= 2 && intent.length > 0) {
    result.push(`while ${b.title} may excel in some areas, ${a.title} delivers a more balanced overall experience`)
  }

  // 🔥 NEW: clearer winner statement
  if (result.length >= 2) {
    result.push(`${a.title} is the better overall choice compared to ${b.title}`)
  }

  // 🔥 FALLBACK
  if (result.length === 0) {
    result.push(`${a.title} edges ahead with a more balanced overall performance`)
  }

  // 🔥 NEW: remove duplicates (critical fix)
  const unique = Array.from(new Set(result))

  return unique.slice(0, 3)
}