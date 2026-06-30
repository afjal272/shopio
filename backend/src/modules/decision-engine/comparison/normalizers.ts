export const normalizeCPU = (score: number) =>
  Math.min(score / 10, 10)

export const normalizeRAM = (ram: number) =>
  Math.min(ram / 2, 10)

export const normalizeBattery = (
  battery: number,
  cpuScore: number
) => {
  let base = battery / 1000

  if (cpuScore > 8) {
    base += 1
  }

  return Math.min(base, 10)
}

export const normalizeCamera = (
  rating: number,
  reviews: number
) => {
  let base = rating * 2

  if (reviews > 5000) {
    base += 0.5
  }

  if (reviews > 20000) {
    base += 1
  }

  return Math.min(base, 10)
}

export const normalizeValue = (
  score: number,
  price: number
) => {
  if (price <= 0) {
    return 0
  }

  return Math.min((score / price) * 10000, 10)
}