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

  // 🔥 MULTI-INTENT
  intent.forEach((i) => {
    const weight = 1 / intent.length

    if (i === "gaming") {
      score += (ramScore * 25 + processorScore * 35 + batteryScore * 10) * weight
    }

    if (i === "balanced") {
      score += (ramScore * 20 + processorScore * 20 + batteryScore * 15 + ratingScore * 25) * weight
    }

    if (i === "camera") {
      score += ratingScore * 30 * weight

      if (product.tags.includes("camera")) {
        score += 15 // 🔻 reduced from 25 (overboost fix)
      }

      score += processorScore * 10 * weight
    }

    if (i === "battery") {
      score += batteryScore * 50 * weight // 🔻 reduced from 70
    }
  })

  // 🔥 TAG BOOST (controlled)
  if (intent.includes("gaming") && product.tags.includes("gaming")) {
    score += 5
  }

  if (intent.includes("battery") && product.tags.includes("battery")) {
    score += 5
  }

  // 🔥 LOW-END PENALTY
  if ((product.specs.ram || 0) < 6) {
    score -= 8
  }

  // 🔥 BASE TRUST
  score += ratingScore * 15

  // 🔥 PRICE LOGIC (better spread)
  if (budget) {
    const utilization = product.price / budget

    if (utilization >= 0.8 && utilization <= 1) {
      score += 15
    } else if (utilization >= 0.6 && utilization < 0.8) {
      score += 10
    } else if (utilization < 0.6) {
      score += 5
    } else {
      score -= 20
    }
  }

  // 🔥 FINAL NORMALIZATION (IMPORTANT)
  const finalScore = Math.round(score)

  // clamp between 20–100 (avoid useless low noise)
  return Math.max(20, Math.min(100, finalScore))
}