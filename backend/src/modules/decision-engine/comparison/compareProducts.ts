import { Product, IntentType } from "../types"

// 🔥 NORMALIZATION FUNCTIONS (NEW - ADDED, NOTHING REMOVED)
const normalizeCPU = (score: number) => {
  return Math.min(score / 10, 10)
}

const normalizeRAM = (ram: number) => {
  return Math.min(ram / 2, 10)
}

const normalizeBattery = (battery: number, cpuScore: number) => {
  let base = battery / 1000
  if (cpuScore > 8) base += 1
  return Math.min(base, 10)
}

const normalizeCamera = (rating: number, reviews: number) => {
  let base = rating * 2
  if (reviews > 5000) base += 0.5
  if (reviews > 20000) base += 1
  return Math.min(base, 10)
}

const normalizeValue = (score: number, price: number) => {
  return Math.min((score / price) * 10000, 10)
}

// 🔥 WEIGHTS (NEW)
const weights = {
  gaming:   { cpu: 4, ram: 3, battery: 2, camera: 1, value: 1 },
  battery:  { cpu: 1, ram: 1, battery: 4, camera: 1, value: 2 },
  camera:   { cpu: 1, ram: 1, battery: 1, camera: 4, value: 2 },
  balanced: { cpu: 3, ram: 2, battery: 2, camera: 2, value: 2 }
}


// 🔥 SAFE COMPARE TWO (UNCHANGED)
function compareTwo(
  a: Product,
  b: Product,
  intent: IntentType[] = ["balanced"]
) {
  const result: string[] = []

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

  if (intent.includes("battery")) {
    if (aBattery > bBattery) {
      result.push(`${a.title} has better battery (${aBattery}mAh)`)
    } else if (bBattery > aBattery) {
      result.push(`${b.title} has better battery (${bBattery}mAh)`)
    }

    pushA(aBattery > bBattery, `${a.title} lasts longer overall`)
  }

  if (intent.includes("camera")) {
    if (aRating > bRating) {
      result.push(`${a.title} has better camera performance`)
    } else if (bRating > aRating) {
      result.push(`${b.title} has better camera performance`)
    }

    pushA(aRating > bRating, `${a.title} is more reliable for photography`)
  }

  const aValue = (aProcessor * 2 + aRam) / safePriceA
  const bValue = (bProcessor * 2 + bRam) / safePriceB

  if (aValue > bValue) {
    result.push(`${a.title} offers better value`)
  } else if (bValue > aValue) {
    result.push(`${b.title} offers better value`)
  }

  if (result.length === 0) {
    if (aRating > bRating) {
      result.push(`${a.title} is overall more reliable`)
    } else {
      result.push(`${b.title} is overall more reliable`)
    }
  }

  return Array.from(new Set(result)).slice(0, 3)
}


// 🔥 MAIN FUNCTION (UPDATED SCORING ONLY)
export function compareProducts(
  products: Product[],
  intent: IntentType[] = ["balanced"]
) {

  if (!Array.isArray(products) || products.length < 2) {
    return {
      winner: null,
      reasons: [],
      scores: [],
      intent
    }
  }

  const safeIntent: IntentType[] =
  Array.isArray(intent) && intent.length > 0
    ? (intent as IntentType[])
    : ["balanced"]

  const primaryIntent: IntentType = (safeIntent[0] as IntentType) || "balanced"
  const w = weights[primaryIntent]

  const scored = products.map((p) => {
    const specs = p.specs || {}

    const cpu = normalizeCPU(specs.processorScore || 0)
    const ram = normalizeRAM(specs.ram || 0)
    const battery = normalizeBattery(specs.battery || 0, cpu)
    const camera = normalizeCamera(p.rating || 0, p.reviewsCount || 0)

    const baseScore =
      cpu * 3 +
      ram * 2 +
      battery * 2 +
      camera * 2

    const value = normalizeValue(baseScore, p.price || 1)

    const finalScore =
      cpu * w.cpu +
      ram * w.ram +
      battery * w.battery +
      camera * w.camera +
      value * w.value

    return { ...p, score: Number(finalScore.toFixed(2)) }
  })

  const sorted = [...scored].sort((a, b) => (b.score || 0) - (a.score || 0))

  const winner = sorted[0]
  const runnerUp = sorted[1]

  if (!winner || !runnerUp) {
    return {
      winner: null,
      reasons: [],
      scores: [],
      intent: safeIntent
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
    intent: safeIntent
  }
}