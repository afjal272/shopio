import { Product } from "../types";

import { CANDIDATE } from "./engine.constants";
import { CandidateSelectionResult } from "./engine.types";

// ======================================================
// Candidate Selection
// ======================================================

export function selectCandidates(
  rankedProducts: Product[]
): CandidateSelectionResult {

  // =====================================================
  // Empty Result
  // =====================================================

  if (rankedProducts.length === 0) {
    return {
      best: null,
      recommendedProducts: [],
    };
  }

  // =====================================================
  // Best Product
  // =====================================================

  const best: Product | null =
    rankedProducts[0] ?? null;

  // =====================================================
  // Recommendation Range
  // =====================================================

  const recommendationStart = 1;

  const recommendationEnd =
    recommendationStart +
    CANDIDATE.MAX_TOP_PICKS;

  // =====================================================
  // Recommended Products
  // =====================================================

  const recommendedProducts =
    rankedProducts.slice(
      recommendationStart,
      recommendationEnd
    );

  // =====================================================
  // Return
  // =====================================================

  return {

    best,

    recommendedProducts,

  };

}