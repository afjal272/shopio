import { Product } from "../types"

export type IntentType = "gaming" | "camera" | "battery" | "balanced"

function normalize(value: number, max: number) {
  if (!value || max === 0) return 0
  return Math.min(1, value / max)
}

export function scoreProduct(
  product: Product,
  intent: IntentType[],
  budget: number | null
) {
  if (intent.length === 0) intent = ["balanced"]

  const ram = normalize(product.specs.ram || 0, 16)
  const cpu = normalize(product.specs.processorScore || 0, 10)
  const batt = normalize(product.specs.battery || 0, 6000)
  const rating = normalize(product.rating, 5)

  const W: Record<
    IntentType,
    { ram: number; cpu: number; batt: number; rating: number }
  > = {
    gaming:   { ram: 0.30, cpu: 0.40, batt: 0.10, rating: 0.20 },
    camera:   { ram: 0.10, cpu: 0.20, batt: 0.10, rating: 0.60 },
    battery:  { ram: 0.10, cpu: 0.10, batt: 0.60, rating: 0.20 },
    balanced: { ram: 0.25, cpu: 0.25, batt: 0.20, rating: 0.30 }
  }

  // 🔥 FIX: proper weighting
  let core = 0

  if (intent.length === 1) {
    const w = W[intent[0]]
    core =
      ram * w.ram +
      cpu * w.cpu +
      batt * w.batt +
      rating * w.rating
  } else {
    intent.forEach((i, idx) => {
      const w = W[i]
      const part =
        ram * w.ram +
        cpu * w.cpu +
        batt * w.batt +
        rating * w.rating

      const pw = idx === 0 ? 0.6 : 0.4 / (intent.length - 1)
      core += part * pw
    })
  }

  // ---------- ADJUSTMENTS ----------
  let adj = 0

  if (intent.includes("gaming") && product.tags.includes("gaming")) adj += 0.05
  if (intent.includes("battery") && product.tags.includes("battery")) adj += 0.05
  if (intent.includes("camera") && product.tags.includes("camera")) adj += 0.05

  if ((product.specs.ram || 0) < 6) adj -= 0.08
  if (intent.includes("gaming") && (product.specs.processorScore || 0) < 6) adj -= 0.1
  if (product.rating < 4) adj -= 0.06

  const reviews = product.reviewsCount ?? 100
  const trust = Math.min(1, Math.log10(reviews + 1) / 3)
  adj += trust * 0.08

  const rawValue =
    ((product.specs.processorScore || 0) + (product.specs.ram || 0)) /
    Math.max(product.price, 1)

  const value = Math.min(rawValue * 6, 0.1)
  adj += value

  if (budget) {
    const u = product.price / budget
    if (u > 1) adj -= 0.15
    else if (u >= 0.8) adj += 0.08
    else if (u >= 0.6) adj += 0.05
    else adj += 0.03
  }

  // clamp adjustments
  adj = Math.max(-0.3, Math.min(0.3, adj))

  const final01 = Math.max(0, Math.min(1, core + adj))
  const total = Math.round(final01 * 100)

  return {
    total,
    breakdown: {
      ram: Math.round(ram * 100),
      processor: Math.round(cpu * 100),
      battery: Math.round(batt * 100),
      rating: Math.round(rating * 100)
    }
  }
}