import { Product } from "../types"
import { ProductWeakness, ScoredProduct } from "./comparison.types"

export function calculateWeaknesses(
  products: ScoredProduct[]
): ProductWeakness[] {

  if (products.length === 0) {
    return []
  }

  const winner = products[0]

  return products.map((product) => {

    if (product.id === winner.id) {
      return {
        id: product.id,
        points: [],
      }
    }

    const points: string[] = []

    const winnerSpecs = winner.specs ?? {}
    const specs = product.specs ?? {}

    // Battery
    if ((specs.battery ?? 0) < (winnerSpecs.battery ?? 0)) {
      points.push(`Battery weaker than ${winner.name}`)
    }

    // RAM
    if ((specs.ram ?? 0) < (winnerSpecs.ram ?? 0)) {
      points.push(`Less RAM than ${winner.name}`)
    }

    // Processor
    if (
      (specs.processorScore ?? 0) <
      (winnerSpecs.processorScore ?? 0)
    ) {
      points.push(`Lower processor performance than ${winner.name}`)
    }

    // Rating
    if (product.rating < winner.rating) {
      points.push(`Lower user rating than ${winner.name}`)
    }

    // Reviews
    if (product.reviewsCount < winner.reviewsCount) {
      points.push(`Lower market trust than ${winner.name}`)
    }

    // Price
    if (
      product.price > winner.price &&
      product.score <= winner.score
    ) {
      points.push(`Costs more while offering less value`)
    }

    return {
      id: product.id,
      points: points.slice(0, 3),
    }

  })

}