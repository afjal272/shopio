export function normalizeCPU(score: number): number {
  return Math.max(0, Math.min(score / 10, 10))
}

export function normalizeRAM(ram: number): number {
  return Math.max(0, Math.min(ram / 2, 10))
}

export function normalizeBattery(
  battery: number,
  cpuScore: number
): number {
  let normalized = battery / 1000

  if (cpuScore > 8) {
    normalized += 1
  }

  return Math.min(normalized, 10)
}

export function normalizeCamera(
  rating: number,
  reviews: number
): number {
  let normalized = rating * 2

  if (reviews > 5000) {
    normalized += 0.5
  }

  if (reviews > 20000) {
    normalized += 1
  }

  return Math.min(normalized, 10)
}

export function normalizeValue(
  score: number,
  price: number
): number {
  if (price <= 0) {
    return 0
  }

  return Math.min((score / price) * 10000, 10)
}