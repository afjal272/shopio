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

  const weights: any = {
    gaming: { ram: 0.3, processor: 0.4, battery: 0.1, rating: 0.2 },
    camera: { ram: 0.1, processor: 0.2, battery: 0.1, rating: 0.6 },
    battery: { ram: 0.1, processor: 0.1, battery: 0.6, rating: 0.2 },
    balanced: { ram: 0.25, processor: 0.25, battery: 0.2, rating: 0.3 }
  }

  intent.forEach((i, index) => {
    const w = weights[i] || weights["balanced"]

    const priorityWeight =
      index === 0 ? 0.6 : 0.4 / Math.max(1, intent.length - 1)

    score +=
      (ramScore * w.ram +
        processorScore * w.processor +
        batteryScore * w.battery +
        ratingScore * w.rating) *
      100 *
      priorityWeight
  })

  if (intent.includes("gaming") && product.tags.includes("gaming")) score += 5
  if (intent.includes("battery") && product.tags.includes("battery")) score += 5

  if ((product.specs.ram || 0) < 6) score -= 8

  if (intent.includes("gaming") && (product.specs.processorScore || 0) < 6) {
    score -= 15
  }

  if (product.rating < 4) score -= 10

  const reviews = product.reviewsCount || 100
  const trustScore = Math.log10(reviews + 1) * ratingScore
  score += trustScore * 20

  const valueScore =
    ((product.specs.processorScore || 0) + (product.specs.ram || 0)) /
    product.price
  score += valueScore * 1000

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