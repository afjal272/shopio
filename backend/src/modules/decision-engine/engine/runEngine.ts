import { ParsedQuery, Product } from "../types";

import { applyFilters } from "../filters/applyFilters";

import { applyFallback } from "./fallback";

import { rankProducts } from "../ranking/rankProducts";

import { selectCandidates } from "./candidateSelection";

import { compareProducts } from "../comparison";

import { buildReasoning } from "./reasoning";

import { generateSuggestions } from "../suggestions";

import { buildOutput } from "./outputBuilder";

import { ENGINE, COMPARISON } from "./engine.constants";

import { EngineResult } from "./engine.types";

// ======================================================
// Decision Engine
// ======================================================

export function runEngine(
  parsed: ParsedQuery,
  products: Product[]
): EngineResult {

  // =====================================================
  // Start Timer
  // =====================================================

  const startTime = performance.now();

  // =====================================================
  // Filter Products
  // =====================================================

  const {
    matchedProducts,
    rejectedProducts: filteredRejectedProducts,
  } = applyFilters(
    products,
    parsed
  );

  // =====================================================
  // Fallback Engine
  // =====================================================

  const fallbackResult =
    applyFallback(
      matchedProducts,
      products,
      parsed
    );

  const {
    products: candidateProducts,
    isRelaxed,
    level,
    appliedRules,
  } = fallbackResult;

  // =====================================================
  // Intent
  // =====================================================

  const intent =
    parsed.weightedIntent ??
    parsed.intent;

  // =====================================================
  // Rank Products
  // =====================================================

  const rankedProducts =
    rankProducts(
      candidateProducts,
      intent,
      parsed.budget,
      parsed.constraints
    );

  // =====================================================
  // Candidate Selection
  // =====================================================

  const {
    best,
    recommendedProducts,
  } = selectCandidates(rankedProducts);

  // =====================================================
  // Best Product Reasoning
  // =====================================================

  const bestReasoning =
    best
      ? buildReasoning(
          best,
          parsed
        )
      : undefined;

  // =====================================================
  // Recommendation Reasoning
  // =====================================================

  const recommendationReasoning =
    recommendedProducts.map((product) =>
      buildReasoning(
        product,
        parsed
      )
    );

  // =====================================================
  // Rejected Products
  // =====================================================

  const rejectedProducts =
    filteredRejectedProducts.map(
      ({ product, reason }) => ({
        id: product.id,
        name: product.name,
        reason,
      })
    );

  // =====================================================
  // Product Comparison
  // =====================================================

  const comparison =
    compareProducts(
      rankedProducts.slice(
        0,
        COMPARISON.TOP_PRODUCTS
      ),
      intent
    );

  // =====================================================
  // Suggestion Engine
  // =====================================================

  const suggestionResult =
    generateSuggestions({

      parsed,

      products,

      matchedProducts: candidateProducts,

      rankedProducts,

      bestProduct: best,

      isRelaxed,

    });

  // =====================================================
  // Execution Metadata
  // =====================================================

  const executionTime =
    Number(
      (
        performance.now() -
        startTime
      ).toFixed(2)
    );

  // =====================================================
  // Build Final Output
  // =====================================================

  return buildOutput({

    best,

    recommendations: recommendedProducts,

    rejected: rejectedProducts,

    comparison,

    parsed,

    isRelaxed,

    bestReasoning,

    recommendationReasoning,

    suggestionResult,

    metadata: {

      version: ENGINE.VERSION,

      executionTime,

      fallbackLevel: level,

      appliedRules,

    },

  });

}