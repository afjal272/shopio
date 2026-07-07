import { Product } from "../types";

import { CANDIDATE } from "./engine.constants";
import { CandidateSelectionResult } from "./engine.types";

export function selectCandidates(
  rankedProducts: Product[]
): CandidateSelectionResult {
  // =====================================================
  // No Products
  // =====================================================

  if (rankedProducts.length === 0) {
    return {
      best: null,

      recommendedProducts: [],

      rejectedProducts: [],
    };
  }

  // =====================================================
  // Best Product
  // =====================================================

  const best = rankedProducts[0];

  // =====================================================
  // Recommended Products
  // =====================================================

  const recommendedProducts = rankedProducts.slice(
    1,
    1 + CANDIDATE.MAX_TOP_PICKS
  );

  // =====================================================
  // Rejected Products
  // =====================================================

  const rejectedProducts = rankedProducts.slice(
    1 + CANDIDATE.MAX_TOP_PICKS,
    1 +
      CANDIDATE.MAX_TOP_PICKS +
      CANDIDATE.MAX_REJECTED_PRODUCTS
  );

  return {
    best,

    recommendedProducts,

    rejectedProducts,
  };
}