import { generateExplanation } from "../explanation/generateExplanation";
import { getRejectionReason } from "../explanation/getRejectionReason";

import { ParsedQuery, Product } from "../types";

import { CONFIDENCE } from "./engine.constants";
import { ProductReasoning } from "./engine.types";

export function buildReasoning(
  product: Product,
  parsed: ParsedQuery,
  rejected = false
): ProductReasoning {
  const intents =
    parsed.weightedIntent?.map((intent) => intent.type) ??
    parsed.intent;

  return {
    explanation: generateExplanation(
      product,
      intents,
      parsed.constraints
    ),

    rejectionReason: rejected
      ? getRejectionReason(
          product,
          intents,
          parsed.budget,
          parsed.constraints
        )
      : undefined,

    confidence: normalizeConfidence(
      product.confidence
    ),
  };
}

// =====================================================
// Helpers
// =====================================================

function normalizeConfidence(
  confidence?: number
): number {
  if (confidence == null) {
    return CONFIDENCE.DEFAULT;
  }

  return Math.min(
    CONFIDENCE.MAX,
    Math.max(
      CONFIDENCE.MIN,
      Math.round(confidence)
    )
  );
}