import { Product, IntentType } from "../types"

// 🔥 SAFE COMPARE TWO
function compareTwo(
  a: Product,
  b: Product,
  intent: IntentType[] = ["balanced"]
) {
  const result: string[] = []

  // ✅ HARD SAFETY
  if (!a || !b) return result

  const aSpecs = a.specs || {}
  const bSpecs = b.specs || {}

  const aRam = aSpecs.ram || 0
  const bRam = bSpecs.ram || 0

  const aProcessor = aSpecs.processorScore || 0
  const bProcessor = bSpecs.processorScore || 0

  const aBattery = aSpecs.battery || 0
  const bBattery = bSpecs.battery || 0

  const aReviews = a.reviewsCount || 0
  const bReviews = b.reviewsCount || 0

  const aRating = a.rating || 0
  const bRating = b.rating || 0

  const safePriceA = Math.max(a.price || 1, 1)
  const safePriceB = Math.max(b.price || 1, 1)

  const pushA = (condition: boolean, text: string) => {
    if (condition) result.push(text)
  }

  // 🎮 GAMING
  if (intent.includes("gaming")) {
    if (aProcessor > bProcessor) {
      result.push(`${a.title} delivers smoother gaming performance`)
    } else if (bProcessor > aProcessor) {
      result.push(`${b.title} delivers smoother gaming performance`)
    }

    if (aRam > bRam) {
      result.push(`${a.title} has better multitasking (${aRam}GB RAM)`)
    } else if (bRam > aRam) {
      result.push(`${b.title} has better multitasking (${bRam}GB RAM)`)
    }

    pushA(
      aProcessor > bProcessor && aRam >= bRam,
      `${a.title} is better optimized for gaming`
    )
  }

  // 🔋 BATTERY
  if (intent.includes("battery")) {
    if (aBattery > bBattery) {
      result.push(`${a.title} has better battery (${aBattery}mAh)`)
    } else if (bBattery > aBattery) {
      result.push(`${b.title} has better battery (${bBattery}mAh)`)
    }

    pushA(aBattery > bBattery, `${a.title} lasts longer overall`)
  }

  // 📸 CAMERA
  if (intent.includes("camera")) {
    if (aRating > bRating) {
      result.push(`${a.title} has better camera performance`)
    } else if (bRating > aRating) {
      result.push(`${b.title} has better camera performance`)
    }

    pushA(aRating > bRating, `${a.title} is more reliable for photography`)
  }

  // 💰 VALUE
  const aValue = (aProcessor * 2 + aRam) / safePriceA
  const bValue = (bProcessor * 2 + bRam) / safePriceB

  if (aValue > bValue) {
    result.push(`${a.title} offers better value`)
  } else if (bValue > aValue) {
    result.push(`${b.title} offers better value`)
  }

  // 🔥 NEW: GENERAL FALLBACK (important)
  if (result.length === 0) {
    if (aRating > bRating) {
      result.push(`${a.title} is overall more reliable`)
    } else {
      result.push(`${b.title} is overall more reliable`)
    }
  }

  return Array.from(new Set(result)).slice(0, 3)
}


// 🔥 MAIN FUNCTION
export function compareProducts(
  products: Product[],
  intent: IntentType[] = ["balanced"]
) {

  // ✅ HARD GUARD
  if (!Array.isArray(products) || products.length < 2) {
    return {
      winner: null,
      reasons: [],
      scores: [],
      intent // 🔥 NEW
    }
  }

  // 🔥 NORMALIZE INTENT
  const safeIntent = Array.isArray(intent) && intent.length > 0
    ? intent
    : ["balanced"]

  // 🧠 INTENT-AWARE SCORING
  const scored = products.map((p) => {
    const specs = p.specs || {}

    let score =
      (specs.processorScore || 0) * 2 +
      (specs.ram || 0) +
      (specs.battery || 0) / 1000 +
      (p.rating || 0) * 2

    // 🔥 NEW: intent weighting
    if (safeIntent.includes("gaming")) {
      score += (specs.processorScore || 0) * 2
      score += (specs.ram || 0)
    }

    if (safeIntent.includes("battery")) {
      score += (specs.battery || 0) / 500
    }

    if (safeIntent.includes("camera")) {
      score += (p.rating || 0) * 3
    }

    return { ...p, score }
  })

  // 🏆 SORT SAFE
  const sorted = [...scored].sort((a, b) => (b.score || 0) - (a.score || 0))

  const winner = sorted[0]
  const runnerUp = sorted[1]

  // ✅ SAFETY AGAIN
  if (!winner || !runnerUp) {
    return {
      winner: null,
      reasons: [],
      scores: [],
      intent: safeIntent // 🔥 NEW
    }
  }

  const reasons = compareTwo(winner, runnerUp, safeIntent)

  return {
    winner: winner.id,
    reasons,
    scores: sorted.map((p) => ({
      id: p.id,
      score: p.score || 0
    })),
    intent: safeIntent // 🔥 NEW
  }
}