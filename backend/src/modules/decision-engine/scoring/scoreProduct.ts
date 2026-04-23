import { Product } from "../types"

export type IntentType = "gaming" | "camera" | "battery" | "balanced"

function normalize(value: number, max: number) {
  if (!value || max === 0) return 0
  return Math.min(1, value / max)
}

export function scoreProduct(
  product: Product,
  intent: IntentType[] | { type: IntentType; weight: number }[],
  budget: number | null,
  constraints?: {
    minRam?: number | null
    minBattery?: number | null
    minRating?: number | null
  }
) {
  // 🔥 BACKWARD + FORWARD COMPAT HANDLING
  let weightedIntent: { type: IntentType; weight: number }[] = []

  if (Array.isArray(intent) && intent.length > 0) {
    if (typeof intent[0] === "string") {
      const weight = 1 / intent.length
      weightedIntent = (intent as IntentType[]).map((i) => ({
        type: i,
        weight
      }))
    } else {
      weightedIntent = intent as { type: IntentType; weight: number }[]
    }
  } else {
    weightedIntent = [{ type: "balanced", weight: 1 }]
  }

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

  weightedIntent.forEach(({ type, weight }) => {
    const w = W[type]

    const part =
      ram * w.ram +
      cpu * w.cpu +
      batt * w.batt +
      rating * w.rating

    core += part * weight
  })

  // ---------- ADJUSTMENTS ----------
  let adj = 0

  const tags = product.tags || []
  const intentTypes = weightedIntent.map((i) => i.type)

  // TAG BOOST
  if (intentTypes.includes("gaming") && tags.includes("gaming")) adj += 0.08
  if (intentTypes.includes("battery") && tags.includes("battery")) adj += 0.08
  if (intentTypes.includes("camera") && tags.includes("camera")) adj += 0.08

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
  if (intentTypes.includes("gaming") && (product.specs.processorScore || 0) < 6) adj -= 0.15
  if ((product.rating || 0) < 4) adj -= 0.08

  // TRUST
  const reviews = product.reviewsCount ?? 100
  const trust = Math.min(1, Math.log10(reviews + 1) / 2.3)
  adj += trust * 0.12

  // VALUE
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

    adj += (1 - u) * 0.05
  }

  // =====================================================
  // 🔥 CONSTRAINT BOOST + PENALTY (UPGRADED)
  // =====================================================

  if (constraints) {
    const specs = product.specs || {}

    // 🔥 RAM
    if (constraints.minRam !== null && constraints.minRam !== undefined) {
      if ((specs.ram || 0) >= constraints.minRam) {
        adj += 0.06 // boost
      } else {
        adj -= 0.12 // penalty (important)
      }
    }

    // 🔥 BATTERY
    if (constraints.minBattery !== null && constraints.minBattery !== undefined) {
      if ((specs.battery || 0) >= constraints.minBattery) {
        adj += 0.05
      } else {
        adj -= 0.10
      }
    }

    // 🔥 RATING
    if (constraints.minRating !== null && constraints.minRating !== undefined) {
      if ((product.rating || 0) >= constraints.minRating) {
        adj += 0.04
      } else {
        adj -= 0.08
      }
    }
  }

  // TIE BREAKERS
  adj += Math.log10(reviews || 1) * 0.02
  adj += (product.rating || 0) * 0.01
  adj += (product.specs.processorScore || 0) * 0.002

  // clamp
  adj = Math.max(-0.25, Math.min(0.25, adj))

  // FINAL
  const final01 = Math.max(0, Math.min(1, core * 0.8 + adj))
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