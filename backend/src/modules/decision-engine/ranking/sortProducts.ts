import { Product } from "../types"

export function sortProducts<T extends Product & { score: number }>(
  products: T[]
): T[] {
  return [...products].sort((a, b) => {
    // 1. Score
    if (b.score !== a.score) {
      return b.score - a.score
    }

    // 2. Reviews
    if (b.reviewsCount !== a.reviewsCount) {
      return b.reviewsCount - a.reviewsCount
    }

    // 3. Rating
    if (b.rating !== a.rating) {
      return b.rating - a.rating
    }

    // 4. Price
    if (a.price !== b.price) {
      return a.price - b.price
    }

    // 5. Brand (alphabetical)
    return a.brand.localeCompare(b.brand)
  })
}