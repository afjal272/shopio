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

  // 🔥 MULTI-INTENT LOGIC
  intent.forEach((i) => {
    const weight = 1 / intent.length

    if (i === "gaming") {
      score += (ramScore * 30 + processorScore * 40 + batteryScore * 10) * weight
    }

    if (i === "camera") {
      score += ratingScore * 30 * weight

      // camera tag boost
      if (product.tags.includes("camera")) {
        score += 25
      }

      // processor matters for image processing
      score += processorScore * 10 * weight
    }

    if (i === "battery") {
      score += batteryScore * 70 * weight
    }
  })

  // 🔥 TAG BOOST
  if (intent.includes("gaming") && product.tags.includes("gaming")) {
    score += 10
  }

  if (intent.includes("battery") && product.tags.includes("battery")) {
    score += 10
  }

  // 🔥 LOW-END PENALTY (softened)
  if ((product.specs.ram || 0) < 6) {
    score -= 5
  }

  // 🔥 BASE TRUST (rating)
  score += ratingScore * 20

  // 🔥 PRICE LOGIC (fixed)
  if (budget) {
    const utilization = product.price / budget

    if (utilization >= 0.7 && utilization <= 1) {
      score += 20
    } else if (utilization < 0.7) {
      score += 10
    } else {
      score -= 15
    }
  }

  // 🔥 FINAL NORMALIZED SCORE (0–100)
  return Math.min(100, Math.round(score))
}