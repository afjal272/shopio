import { ComparisonWinner, ScoredProduct } from "./comparison.types"

export function calculateWinner(
  products: ScoredProduct[]
): ComparisonWinner | null {

  if (products.length < 2) {
    return null
  }

  const rankedProducts = [...products].sort(
    (a, b) => b.score - a.score
  )

  return {
    winner: rankedProducts[0],
    runnerUp: rankedProducts[1],
    rankedProducts,
  }
}