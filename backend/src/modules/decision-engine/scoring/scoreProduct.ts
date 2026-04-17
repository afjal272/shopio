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
        score += 15
      }

      score += processorScore * 10 * weight
    }

    if (i === "battery") {
      score += batteryScore * 50 * weight
    }
  })

  if (intent.includes("gaming") && product.tags.includes("gaming")) {
    score += 5
  }

  if (intent.includes("battery") && product.tags.includes("battery")) {
    score += 5
  }

  if ((product.specs.ram || 0) < 6) {
    score -= 8
  }

  score += ratingScore * 15

  if (budget) {
    const utilization = product.price / budget

    if (utilization >= 0.8 && utilization <= 1) score += 15
    else if (utilization >= 0.6) score += 10
    else if (utilization < 0.6) score += 5
    else score -= 20
  }

  return {
    total: Math.min(100, Math.round(score)),
    breakdown: {
      ram: Math.round(ramScore * 100),
      processor: Math.round(processorScore * 100),
      battery: Math.round(batteryScore * 100),
      rating: Math.round(ratingScore * 100)
    }
  }
}