export function normalize(value: number, max: number) {
  if (!value || max === 0) {
    return 0
  }

  return Math.min(1, value / max)
}

export function calculateTrustScore(reviews: number) {
  return Math.min(1, Math.log10(reviews + 1) / 2.3)
}

export function calculateValueScore(
  processor: number,
  ram: number,
  price: number
) {
  const safePrice = Math.max(price, 1)

  return (processor + ram) / safePrice
}