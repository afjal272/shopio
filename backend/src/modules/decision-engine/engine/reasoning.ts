import { generateExplanation } from "../explanation/generateExplanation";
import { getRejectionReason } from "../explanation/getRejectionReason";

import {
  ParsedQuery,
  Product,
  IntentType,
} from "../types";

import { CONFIDENCE } from "./engine.constants";
import { ProductReasoning } from "./engine.types";

// ======================================================
// Reasoning Builder
// ======================================================

export function buildReasoning(
  product: Product,
  parsed: ParsedQuery,
  rejected = false
): ProductReasoning {

  const intents = extractIntents(parsed);

  const explanation =
    generateExplanation(
      product,
      intents,
      parsed.constraints
    );

  const rejectionReason =
    rejected
      ? getRejectionReason(
          product,
          intents,
          parsed.budget,
          parsed.constraints
        )
      : undefined;

  return {

    explanation,

    rejectionReason,

    confidence:
      normalizeConfidence(
        product.confidence
      ),

  };

}

// ======================================================
// Intent Extraction
// ======================================================

function extractIntents(
  parsed: ParsedQuery
): IntentType[] {

  if (
    parsed.weightedIntent &&
    parsed.weightedIntent.length > 0
  ) {
    return parsed.weightedIntent.map(
      intent => intent.type
    );
  }

  return parsed.intent;

}

// ======================================================
// Confidence
// ======================================================

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