import { Product } from "../types";

import { CANDIDATE } from "./engine.constants";
import { CandidateSelectionResult } from "./engine.types";

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
      rejectedProducts: [],
    };
  }

  // =====================================================
  // Best Product
  // =====================================================

  const best: Product | null = rankedProducts[0] ?? null;

  // =====================================================
  // Slice Positions
  // =====================================================

  const recommendationStart = 1;

  const recommendationEnd =
    recommendationStart +
    CANDIDATE.MAX_TOP_PICKS;

  const rejectionStart =
    recommendationEnd;

  const rejectionEnd =
    rejectionStart +
    CANDIDATE.MAX_REJECTED_PRODUCTS;

  // =====================================================
  // Recommended Products
  // =====================================================

  const recommendedProducts =
    rankedProducts.slice(
      recommendationStart,
      recommendationEnd
    );

  // =====================================================
  // Rejected Products
  // =====================================================

  const rejectedProducts =
    rankedProducts.slice(
      rejectionStart,
      rejectionEnd
    );

  // =====================================================
  // Return
  // =====================================================

  return {
    best,
    recommendedProducts,
    rejectedProducts,
  };

}