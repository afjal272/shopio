import {
  AnalyzerResult,
  ConfidenceAnalysis,
  SuggestionContext,
} from "../suggestion.types";

export function analyzeConfidence(
  context: SuggestionContext
): AnalyzerResult<ConfidenceAnalysis> {
  const { parsed, products, matchedProducts } = context;

  const hasBudget = parsed.budget !== null;

  const hasIntent = parsed.intent.length > 0;

  const hasConstraints =
    !!parsed.constraints &&
    Object.keys(parsed.constraints).length > 0;

  let confidence = 0;

  if (hasBudget) confidence += 30;

  if (hasIntent) confidence += 30;

  if (hasConstraints) confidence += 20;

  if (products.length > 0) {
    confidence += Math.round(
      (matchedProducts.length / products.length) * 20
    );
  }

  confidence = Math.min(100, confidence);

  return {
    analysis: {
      confidence,
      matchedProducts: matchedProducts.length,
      totalProducts: products.length,
      hasBudget,
      hasIntent,
      hasConstraints,
    },
    suggestions: [],
    confidence: confidence / 100,
  };
}