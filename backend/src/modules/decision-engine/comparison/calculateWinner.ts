import {
  ComparisonWinner,
  ScoredProduct,
} from "./comparison.types";

export function calculateWinner(
  products: ScoredProduct[]
): ComparisonWinner | null {

  // =====================================================
  // Validation
  // =====================================================

  if (!products || products.length < 2) {
    return null;
  }

  // =====================================================
  // Ranking
  // =====================================================

  const rankedProducts = [...products].sort(
    (a, b) => {

      // 1. Score
      if (b.score !== a.score) {
        return b.score - a.score;
      }

      // 2. Confidence
      if (
        (b.confidence ?? 0) !==
        (a.confidence ?? 0)
      ) {
        return (
          (b.confidence ?? 0) -
          (a.confidence ?? 0)
        );
      }

      // 3. Reviews
      if (
        b.reviewsCount !==
        a.reviewsCount
      ) {
        return (
          b.reviewsCount -
          a.reviewsCount
        );
      }

      // 4. Rating
      if (b.rating !== a.rating) {
        return b.rating - a.rating;
      }

      // 5. Price
      if (a.price !== b.price) {
        return a.price - b.price;
      }

      // 6. Stable Sorting
      return a.id.localeCompare(b.id);

    }
  );

  // =====================================================
  // Winner
  // =====================================================

  const winner = rankedProducts[0];

  const runnerUp = rankedProducts[1];

  // =====================================================
  // Winning Margin
  // =====================================================

  const winningMargin = Number(
    (winner.score - runnerUp.score).toFixed(2)
  );

  // =====================================================
  // Result
  // =====================================================

  return {

    winner,

    runnerUp,

    rankedProducts,

    winningMargin,

  };

}