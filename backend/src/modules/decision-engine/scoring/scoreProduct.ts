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

  intent.forEach(i => {
    if (i === "gaming") {
      score += ramScore * 30
      score += processorScore * 40
      score += batteryScore * 10
    }

    if (i === "battery") {
  score += batteryScore * 50
}


// 🔥 penalty for weak specs
if ((product.specs.ram || 0) < 6) {
  score -= 10
}

    if (i === "camera") {
      score += ratingScore * 50
    }
  })

  // base trust
  score += ratingScore * 20

  // 🔥 NEW: PRICE LOGIC
  if (budget) {
    const priceDiff = budget - product.price

    if (priceDiff >= 0) {
      // closer to budget = better utilization
      const utilization = product.price / budget
      score += utilization * 20
    } else {
      // over budget = penalty
      score -= 20
    }
  }

  return Math.round(score)
}