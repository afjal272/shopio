import { SUGGESTION } from "../engine/engine.constants";

import {
  SuggestionContext,
  SuggestionEngineResult,
} from "./suggestion.types";

import { analyzeBudget } from "./analyzers/budgetAnalyzer";

import { generateAlternativeSuggestions } from "./generators/alternativeSuggestions";
import { generateBudgetSuggestions } from "./generators/budgetSuggestions";
import { generateConstraintSuggestions } from "./generators/constraintSuggestions";
import { generateIntentSuggestions } from "./generators/intentSuggestions";
import { generateRelaxedSuggestions } from "./generators/relaxedSuggestions";
import { generateUpgradeSuggestions } from "./generators/upgradeSuggestions";

// ======================================================
// Priority Order
// ======================================================

const PRIORITY_ORDER = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
} as const;

// ======================================================
// Suggestion Engine
// ======================================================

export function generateSuggestions(
  context: SuggestionContext
): SuggestionEngineResult {
  // =====================================================
  // Analyze
  // =====================================================

  const budgetAnalysis = analyzeBudget(context);

  // =====================================================
  // Generate
  // =====================================================

  const suggestions = [
    ...generateBudgetSuggestions(
      budgetAnalysis.analysis
    ),

    ...generateUpgradeSuggestions(
      budgetAnalysis.analysis
    ),

    ...generateConstraintSuggestions(
      context
    ),

    ...generateIntentSuggestions(context),

    ...generateAlternativeSuggestions(
      context
    ),

    ...generateRelaxedSuggestions(context),
  ];

  // =====================================================
  // Remove Duplicate Suggestions
  // =====================================================

  const uniqueSuggestions = Array.from(
    new Map(
      suggestions.map((suggestion) => [
        suggestion.id,
        suggestion,
      ])
    ).values()
  );

  // =====================================================
  // Sort
  // =====================================================

  uniqueSuggestions.sort(
    (a, b) =>
      PRIORITY_ORDER[b.priority] -
      PRIORITY_ORDER[a.priority]
  );

  // =====================================================
  // Limit Results
  // =====================================================

  const finalSuggestions =
    uniqueSuggestions.slice(
      0,
      SUGGESTION.MAX_RESULTS
    );

  // =====================================================
  // Confidence
  // =====================================================

  const confidence =
    finalSuggestions.length === 0
      ? 1
      : Math.round(
          (finalSuggestions.reduce(
            (sum, suggestion) =>
              sum + suggestion.confidence,
            0
          ) /
            finalSuggestions.length) *
            100
        ) / 100;

  // =====================================================
  // Result
  // =====================================================

  return {
    suggestions: finalSuggestions,

    confidence,

    metadata: {
      generatedAt: Date.now(),

      totalSuggestions:
        finalSuggestions.length,
    },
  };
}