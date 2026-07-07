import {
  AffordabilityAnalysis,
  AnalyzerResult,
  SuggestionContext,
} from "../suggestion.types";

const DEFAULT_CONFIDENCE = 0.95;

export function analyzeAffordability(
  context: SuggestionContext
): AnalyzerResult<AffordabilityAnalysis> {
  const { parsed, products } = context;

  const budget = parsed.budget;

  if (budget === null) {
    return {
      analysis: {
        totalProducts: products.length,
        affordableProducts: 0,
        expensiveProducts: products.length,
        affordabilityRatio: 0,
        affordabilityScore: 0,
      },
      suggestions: [],
      confidence: DEFAULT_CONFIDENCE,
    };
  }

  const affordableProducts = countAffordableProducts(products, budget);

  const expensiveProducts =
    products.length - affordableProducts;

  const affordabilityRatio = calculateAffordabilityRatio(
    affordableProducts,
    products.length
  );

  const affordabilityScore = calculateAffordabilityScore(
    affordabilityRatio
  );

  return {
    analysis: {
      totalProducts: products.length,
      affordableProducts,
      expensiveProducts,
      affordabilityRatio,
      affordabilityScore,
    },
    suggestions: [],
    confidence: DEFAULT_CONFIDENCE,
  };
}

function countAffordableProducts(
  products: SuggestionContext["products"],
  budget: number
): number {
  return products.filter(
    (product) => product.price <= budget
  ).length;
}

function calculateAffordabilityRatio(
  affordableProducts: number,
  totalProducts: number
): number {
  if (totalProducts === 0) {
    return 0;
  }

  return Number(
    (affordableProducts / totalProducts).toFixed(2)
  );
}

function calculateAffordabilityScore(
  affordabilityRatio: number
): number {
  return Math.round(affordabilityRatio * 100);
}