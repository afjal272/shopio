import {
  ProductStrength,
  ProductWeakness,
  ScoredProduct,
} from "./comparison.types";

export function calculateWeaknesses(
  products: ScoredProduct[]
): ProductWeakness[] {

  // =====================================================
  // Validation
  // =====================================================

  if (!products || products.length === 0) {
    return [];
  }

  const winner = products[0];

  const winnerSpecs = winner.specs ?? {};

  // =====================================================
  // Compare Every Product Against Winner
  // =====================================================

  return products.map((product) => {

    // Winner has no weaknesses
    if (product.id === winner.id) {

      return {

        id: product.id,

        points: [],

      };

    }

    const specs = product.specs ?? {};

    const points: string[] = [];

    // =====================================================
    // Processor
    // =====================================================

    if (
      (specs.processorScore ?? 0) <
      (winnerSpecs.processorScore ?? 0)
    ) {

      points.push(
        `Lower processor performance than ${winner.name}`
      );

    }

    // =====================================================
    // RAM
    // =====================================================

    if (
      (specs.ram ?? 0) <
      (winnerSpecs.ram ?? 0)
    ) {

      points.push(
        `Less RAM than ${winner.name}`
      );

    }

    // =====================================================
    // Battery
    // =====================================================

    if (
      (specs.battery ?? 0) <
      (winnerSpecs.battery ?? 0)
    ) {

      points.push(
        `Shorter battery life than ${winner.name}`
      );

    }

    // =====================================================
    // Rating
    // =====================================================

    if (
      (product.rating ?? 0) <
      (winner.rating ?? 0)
    ) {

      points.push(
        `Lower user rating than ${winner.name}`
      );

    }

    // =====================================================
    // Reviews / Trust
    // =====================================================

    if (
      (product.reviewsCount ?? 0) <
      (winner.reviewsCount ?? 0)
    ) {

      points.push(
        `Lower market trust than ${winner.name}`
      );

    }

    // =====================================================
    // Value
    // =====================================================

    if (
      product.price > winner.price &&
      (product.score ?? 0) <= (winner.score ?? 0)
    ) {

      points.push(
        "Costs more while offering less value"
      );

    }

    // =====================================================
    // Confidence
    // =====================================================

    if (
      (product.confidence ?? 0) <
      (winner.confidence ?? 0)
    ) {

      points.push(
        "Recommendation confidence is lower"
      );

    }

    // =====================================================
    // Score Gap
    // =====================================================

    const scoreGap =
      (winner.score ?? 0) -
      (product.score ?? 0);

    if (scoreGap >= 10) {

      points.push(
        "Noticeably lower overall performance"
      );

    }

    // =====================================================
    // Remove Duplicates
    // =====================================================

    const uniquePoints = Array.from(
      new Set(points)
    );

    // =====================================================
    // Result
    // =====================================================

    return {

      id: product.id,

      points: uniquePoints.slice(0, 4),

    };

  });

}