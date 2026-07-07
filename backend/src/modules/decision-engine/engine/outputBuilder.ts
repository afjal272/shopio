import { ComparisonResult } from "../comparison";
import { SuggestionEngineResult } from "../suggestions";
import { ParsedQuery, Product } from "../types";

import {
  CONFIDENCE,
  ENGINE,
} from "./engine.constants";

import {
  EngineMetadata,
  EngineResult,
  ProductReasoning,
  RejectedProduct,
} from "./engine.types";

import { optimizeProduct } from "./optimizer";

// ======================================================
// Build Output Params
// ======================================================

export interface BuildOutputParams {
  best: Product | null;

  recommendations: Product[];

  rejected: RejectedProduct[];

  comparison: ComparisonResult;

  parsed: ParsedQuery;

  isRelaxed: boolean;

  bestReasoning?: ProductReasoning;

  recommendationReasoning?: ProductReasoning[];

  suggestionResult: SuggestionEngineResult;

  metadata?: Partial<EngineMetadata>;
}

// ======================================================
// Output Builder
// ======================================================

export function buildOutput(
  params: BuildOutputParams
): EngineResult {
  const {
    best,
    recommendations,
    rejected,
    comparison,
    parsed,
    isRelaxed,
    bestReasoning,
    recommendationReasoning = [],
    suggestionResult,
    metadata,
  } = params;

  return {
    best: best
      ? {
          ...optimizeProduct(best),

          explanation:
            bestReasoning?.explanation,

          confidence:
            bestReasoning?.confidence ??
            best.confidence ??
            CONFIDENCE.DEFAULT,
        }
      : null,

    recommendations: recommendations.map(
      (product, index) => ({
        ...optimizeProduct(product),

        explanation:
          recommendationReasoning[index]
            ?.explanation,

        confidence:
          recommendationReasoning[index]
            ?.confidence ??
          product.confidence ??
          CONFIDENCE.DEFAULT,
      })
    ),

    notRecommended: rejected,

    comparison,

    parsed,

    isRelaxed,

    confidence:
      suggestionResult.confidence,

    suggestions:
      suggestionResult.suggestions,

    metadata: {
      version: ENGINE.VERSION,

      executionTime:
        metadata?.executionTime ?? 0,

      fallbackLevel:
        metadata?.fallbackLevel ?? 0,

      appliedRules:
        metadata?.appliedRules ?? [],

      timestamp:
        metadata?.timestamp ?? Date.now(),
    },
  };
}