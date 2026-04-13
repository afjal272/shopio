import { Product } from "../types"

function normalize(value: number, max: number) {
  if (!value) return 0
  return value / max
}

export function scoreProduct(
  product: Product,
  intent: string[],
  budget: number | null
) {
  let score = 0

  const ramScore = normalize(product.specs.ram || 0, 16)
  const processorScore = normalize(product.specs.processorScore || 0, 10)
  const batteryScore = normalize(product.specs.battery || 0, 6000)
  const ratingScore = normalize(product.rating, 5)

  // 🔥 MULTI-INTENT WEIGHTING
  intent.forEach((i) => {
    const weight = 1 / intent.length

    if (i === "gaming") {
      score += (ramScore * 30 + processorScore * 40 + batteryScore * 10) * weight
    }

    if (i === "camera") {
      score += ratingScore * 40 * weight

      // 🔥 strong boost for actual camera phones
      if (product.tags.includes("camera")) {
        score += 20
      }
    }

    if (i === "battery") {
      score += batteryScore * 70 * weight
    }
  })

  // 🔥 TAG-BASED BOOST
  if (intent.includes("gaming") && product.tags.includes("gaming")) {
    score += 10
  }

  if (intent.includes("battery") && product.tags.includes("battery")) {
    score += 10
  }

  // 🔥 LOW-END PENALTY
  if ((product.specs.ram || 0) < 6) {
    score -= 10
  }

  // base trust
  score += ratingScore * 20

  // 🔥 PRICE LOGIC
  if (budget) {
    const priceDiff = budget - product.price

    if (priceDiff >= 0) {
      const utilization = product.price / budget
      score += utilization * 20
    } else {
      score -= 20
    }
  }

  // 🔥 FINAL SCORE (NO HARD CAP)
  return Math.round(score / 1.2)
}