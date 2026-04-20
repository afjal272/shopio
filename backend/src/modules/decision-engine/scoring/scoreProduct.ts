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
  // ---------- NORMALIZED FEATURES (0–1) ----------
  const ram = normalize(product.specs.ram || 0, 16)
  const cpu = normalize(product.specs.processorScore || 0, 10)
  const batt = normalize(product.specs.battery || 0, 6000)
  const rating = normalize(product.rating, 5)

  // ---------- INTENT WEIGHTS ----------
  const W: Record<
    IntentType,
    { ram: number; cpu: number; batt: number; rating: number }
  > = {
    gaming:   { ram: 0.30, cpu: 0.40, batt: 0.10, rating: 0.20 },
    camera:   { ram: 0.10, cpu: 0.20, batt: 0.10, rating: 0.60 },
    battery:  { ram: 0.10, cpu: 0.10, batt: 0.60, rating: 0.20 },
    balanced: { ram: 0.25, cpu: 0.25, batt: 0.20, rating: 0.30 }
  }

  // ---------- CORE SCORE (0–1) ----------
  // primary intent 70%, rest 30% split
  let core = 0
  intent.forEach((i, idx) => {
    const w = W[i]
    const part = ram * w.ram + cpu * w.cpu + batt * w.batt + rating * w.rating
    const pw = idx === 0 ? 0.7 : 0.3 / Math.max(1, intent.length - 1)
    core += part * pw
  })

  // ---------- ADJUSTMENTS (small deltas, still 0–1 space) ----------
  let adj = 0

  // tag boosts (controlled)
  if (intent.includes("gaming") && product.tags.includes("gaming")) adj += 0.04
  if (intent.includes("battery") && product.tags.includes("battery")) adj += 0.04
  if (intent.includes("camera") && product.tags.includes("camera")) adj += 0.04

  // penalties
  if ((product.specs.ram || 0) < 6) adj -= 0.06
  if (intent.includes("gaming") && (product.specs.processorScore || 0) < 6) adj -= 0.08
  if (product.rating < 4) adj -= 0.05

  // trust (reviews)
  const reviews = (product.reviewsCount ?? 100)
  const trust = Math.min(1, Math.log10(reviews + 1) / 3) // 0–1 cap
  adj += trust * 0.06

  // value-for-money (capped)
  const rawValue =
    ((product.specs.processorScore || 0) + (product.specs.ram || 0)) /
    Math.max(product.price, 1)

  const value = Math.min(rawValue * 5, 0.08) // cap at +0.08
  adj += value

  // price fit vs budget
  if (budget) {
    const u = product.price / budget
    if (u > 1) adj -= 0.12
    else if (u >= 0.8) adj += 0.06
    else if (u >= 0.6) adj += 0.04
    else adj += 0.02
  }

  // ---------- FINAL (0–100) ----------
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