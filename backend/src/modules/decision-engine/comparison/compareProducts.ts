import { Product } from "../types"

export function compareProducts(a: Product, b: Product) {
  const result: string[] = []

  if ((a.specs.ram || 0) > (b.specs.ram || 0)) {
    result.push(`${a.title} has more RAM (${a.specs.ram}GB vs ${b.specs.ram}GB)`)
  }

  if ((a.specs.processorScore || 0) > (b.specs.processorScore || 0)) {
    result.push(`${a.title} has a stronger processor`)
  }

  if ((a.specs.battery || 0) > (b.specs.battery || 0)) {
    result.push(`${a.title} has better battery (${a.specs.battery}mAh)`)
  }

  if (a.rating > b.rating) {
    result.push(`${a.title} has higher rating (${a.rating})`)
  }

  if (a.price < b.price) {
    result.push(`${a.title} is more value for money`)
  }

  return result
}