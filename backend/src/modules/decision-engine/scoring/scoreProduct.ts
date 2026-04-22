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
  if (!intent || intent.length === 0) intent = ["balanced"]

  const ram = normalize(product.specs.ram || 0, 16)
  const cpu = normalize(product.specs.processorScore || 0, 10)
  const batt = normalize(product.specs.battery || 0, 6000)
  const rating = normalize(product.rating || 0, 5)

  const W: Record<
    IntentType,
    { ram: number; cpu: number; batt: number; rating: number }
  > = {
    gaming:   { ram: 0.30, cpu: 0.40, batt: 0.10, rating: 0.20 },
    camera:   { ram: 0.10, cpu: 0.20, batt: 0.10, rating: 0.60 },
    battery:  { ram: 0.10, cpu: 0.10, batt: 0.60, rating: 0.20 },
    balanced: { ram: 0.25, cpu: 0.25, batt: 0.20, rating: 0.30 }
  }

  // 🔥 CORE SCORE
  let core = 0

  if (intent.length === 1) {
    const w = W[intent[0]]
    core = ram * w.ram + cpu * w.cpu + batt * w.batt + rating * w.rating
  } else {
    const primaryWeight = 0.6
    const secondaryWeight = intent.length > 1 ? 0.4 / (intent.length - 1) : 0

    intent.forEach((i, idx) => {
      const w = W[i]
      const part =
        ram * w.ram +
        cpu * w.cpu +
        batt * w.batt +
        rating * w.rating

      const pw = idx === 0 ? primaryWeight : secondaryWeight
      core += part * pw
    })
  }

  // ---------- ADJUSTMENTS ----------
  let adj = 0

  const tags = product.tags || []

  // TAG BOOST (safe)
  if (intent.includes("gaming") && tags.includes("gaming")) adj += 0.08
  if (intent.includes("battery") && tags.includes("battery")) adj += 0.08
  if (intent.includes("camera") && tags.includes("camera")) adj += 0.08

  // BRAND BOOST
  const brandMap: Record<string, number> = {
    samsung: 0.06,
    apple: 0.10,
    iqoo: 0.05,
    realme: 0.04,
    redmi: 0.04,
    poco: 0.05
  }

  const brand = (product as any).brand?.toLowerCase?.() || ""
  adj += brandMap[brand] || 0

  // PENALTIES
  if ((product.specs.ram || 0) < 6) adj -= 0.12
  if (intent.includes("gaming") && (product.specs.processorScore || 0) < 6) adj -= 0.15
  if ((product.rating || 0) < 4) adj -= 0.08

  // TRUST (log-based)
  const reviews = product.reviewsCount ?? 100
  const trust = Math.min(1, Math.log10(reviews + 1) / 2.3)
  adj += trust * 0.12

  // VALUE (avoid division explosion)
  const safePrice = Math.max(product.price || 1, 1)
  const rawValue =
    ((product.specs.processorScore || 0) + (product.specs.ram || 0)) /
    safePrice

  adj += Math.min(rawValue * 4, 0.08)

  // PRICE FIT
  if (budget && budget > 0) {
    const u = product.price / budget

    if (u > 1) adj -= 0.18
    else if (u >= 0.8) adj += 0.08
    else if (u >= 0.6) adj += 0.05
    else adj += 0.03

    // EXTRA: cheap advantage (controlled)
    adj += (1 - u) * 0.05
  }

  // 🔥 TIE BREAKERS (controlled, not overpowering)
  adj += Math.log10(reviews || 1) * 0.02
  adj += (product.rating || 0) * 0.01
  adj += (product.specs.processorScore || 0) * 0.002

  // clamp adjustments
  adj = Math.max(-0.25, Math.min(0.25, adj))

  // FINAL SCORE
  const final01 = Math.max(0, Math.min(1, core * 0.8 + adj))

  // NON-LINEAR SCALE
  const total = Math.round(Math.pow(final01, 1.4) * 100)

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