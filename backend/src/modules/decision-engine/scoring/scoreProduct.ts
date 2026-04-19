import { Product } from "../types"

export type IntentType = "gaming" | "camera" | "battery" | "balanced"

function normalize(value: number, max: number) {
  if (!value || max === 0) return 0
  return value / max
}

export function scoreProduct(
  product: Product,
  intent: IntentType[],
  budget: number | null
) {
  let score = 0
  let maxScore = 0

  const ramScore = normalize(product.specs.ram || 0, 16)
  const processorScore = normalize(product.specs.processorScore || 0, 10)
  const batteryScore = normalize(product.specs.battery || 0, 6000)
  const ratingScore = normalize(product.rating, 5)

  const weights: Record<
    IntentType,
    { ram: number; processor: number; battery: number; rating: number }
  > = {
    gaming: { ram: 0.3, processor: 0.4, battery: 0.1, rating: 0.2 },
    camera: { ram: 0.1, processor: 0.2, battery: 0.1, rating: 0.6 },
    battery: { ram: 0.1, processor: 0.1, battery: 0.6, rating: 0.2 },
    balanced: { ram: 0.25, processor: 0.25, battery: 0.2, rating: 0.3 }
  }

  intent.forEach((i, index) => {
    const w = weights[i]

    const priorityWeight =
      index === 0 ? 0.6 : 0.4 / Math.max(1, intent.length - 1)

    const partScore =
      ramScore * w.ram +
      processorScore * w.processor +
      batteryScore * w.battery +
      ratingScore * w.rating

    score += partScore * priorityWeight
    maxScore += 1 * priorityWeight
  })

  // 🔥 TAG BOOST
  if (intent.includes("gaming") && product.tags.includes("gaming")) {
    score += 0.05
    maxScore += 0.05
  }

  if (intent.includes("battery") && product.tags.includes("battery")) {
    score += 0.05
    maxScore += 0.05
  }

  // 🔻 PENALTIES
  if ((product.specs.ram || 0) < 6) score -= 0.1

  if (intent.includes("gaming") && (product.specs.processorScore || 0) < 6) {
    score -= 0.15
  }

  if (product.rating < 4) score -= 0.1

  // 🔥 TRUST SCORE
  const reviews =
    (product as Product & { reviewsCount?: number }).reviewsCount || 100

  const trustScore = Math.log10(reviews + 1) * ratingScore
  score += trustScore * 0.2
  maxScore += 0.2

  // 🔥 VALUE SCORE (SAFE + CONTROLLED)
  const rawValue =
    ((product.specs.processorScore || 0) + (product.specs.ram || 0)) /
    Math.max(product.price, 1)

  const valueScore = Math.min(rawValue, 0.002)

  score += valueScore * 8   // 🔻 reduced from 10 (more realistic)
  maxScore += 8

  // 🔥 PRICE LOGIC
  if (budget) {
    const utilization = product.price / budget

    if (utilization >= 0.8 && utilization <= 1) score += 0.15
    else if (utilization >= 0.6) score += 0.1
    else if (utilization < 0.6) score += 0.05
    else score -= 0.2

    maxScore += 0.2
  }

  // 🔥 SAFETY (division fix)
  if (maxScore === 0) {
    return {
      total: 0,
      breakdown: {
        ram: 0,
        processor: 0,
        battery: 0,
        rating: 0
      }
    }
  }

  // 🔥 FINAL NORMALIZATION
  const finalScore = (score / maxScore) * 100

  return {
    total: Math.max(0, Math.min(100, Math.round(finalScore))),
    breakdown: {
      ram: Math.round(ramScore * 100),
      processor: Math.round(processorScore * 100),
      battery: Math.round(batteryScore * 100),
      rating: Math.round(ratingScore * 100)
    }
  }
}