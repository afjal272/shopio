import {
  AnalyzerResult,
  SuggestionContext,
  TradeoffAnalysis,
} from "../suggestion.types";

const DEFAULT_CONFIDENCE = 0.9;

export function analyzeTradeoff(
  context: SuggestionContext
): AnalyzerResult<TradeoffAnalysis> {
  const { bestProduct, rankedProducts } = context;

  if (!bestProduct || rankedProducts.length < 2) {
    return {
      analysis: {
        strengths: [],
        compromises: [],
        scoreDifference: 0,
        hasTradeoff: false,
      },
      suggestions: [],
      confidence: DEFAULT_CONFIDENCE,
    };
  }

  const secondBest = rankedProducts[1];

  const strengths = bestProduct.highlights.filter(
    (item) => !secondBest.highlights.includes(item)
  );

  const compromises = bestProduct.weaknesses.filter(
    (item) => secondBest.weaknesses.includes(item)
  );

  const scoreDifference = Math.round(
    (bestProduct.score ?? 0) -
    (secondBest.score ?? 0)
  );

  return {
    analysis: {
      strengths,
      compromises,
      scoreDifference,
      hasTradeoff:
        strengths.length > 0 || compromises.length > 0,
    },
    suggestions: [],
    confidence: DEFAULT_CONFIDENCE,
  };
}