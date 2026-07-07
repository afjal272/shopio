import {
  AnalyzerResult,
  BudgetAnalysis,
  SuggestionContext,
} from "../suggestion.types";

const UNDER_BUDGET_THRESHOLD = 0.15;
const DEFAULT_CONFIDENCE = 0.95;

export function analyzeBudget(
  context: SuggestionContext
): AnalyzerResult<BudgetAnalysis> {
  const { parsed, matchedProducts, products } = context;

  const currentBudget = parsed.budget ?? null;

  if (currentBudget === null) {
    return {
      analysis: {
        currentBudget: null,
        recommendedBudget: null,
        budgetGap: 0,
        budgetStatus: "well_matched",
        affordabilityScore: 0,
        averageMatchedPrice: 0,
        unlockedProducts: 0,
      },
      suggestions: [],
      confidence: DEFAULT_CONFIDENCE,
    };
  }

  const averageMatchedPrice = calculateAverageMatchedPrice(matchedProducts);

  const recommendedBudget = findRecommendedBudget(
    currentBudget,
    products
  );

  const budgetGap = calculateBudgetGap(
    currentBudget,
    recommendedBudget
  );

  const unlockedProducts = calculateUnlockedProducts(
    currentBudget,
    recommendedBudget,
    products
  );

  const affordabilityScore = calculateAffordabilityScore(
    matchedProducts.length,
    products.length
  );

  const budgetStatus = getBudgetStatus(
    currentBudget,
    budgetGap
  );

  return {
    analysis: {
      currentBudget,
      recommendedBudget,
      budgetGap,
      budgetStatus,
      affordabilityScore,
      averageMatchedPrice,
      unlockedProducts,
    },
    suggestions: [],
    confidence: DEFAULT_CONFIDENCE,
  };
}

function calculateAverageMatchedPrice(
  matchedProducts: SuggestionContext["matchedProducts"]
): number {
  if (matchedProducts.length === 0) {
    return 0;
  }

  const total = matchedProducts.reduce(
    (sum, product) => sum + product.price,
    0
  );

  return Math.round(total / matchedProducts.length);
}

function findRecommendedBudget(
  currentBudget: number,
  products: SuggestionContext["products"]
): number {
  const nextProduct = products
    .filter((product) => product.price > currentBudget)
    .sort((a, b) => a.price - b.price)[0];

  return nextProduct?.price ?? currentBudget;
}

function calculateBudgetGap(
  currentBudget: number,
  recommendedBudget: number
): number {
  return Math.max(0, recommendedBudget - currentBudget);
}

function calculateUnlockedProducts(
  currentBudget: number,
  recommendedBudget: number,
  products: SuggestionContext["products"]
): number {
  return products.filter(
    (product) =>
      product.price > currentBudget &&
      product.price <= recommendedBudget
  ).length;
}

function calculateAffordabilityScore(
  matchedCount: number,
  totalCount: number
): number {
  if (matchedCount === 0 || totalCount === 0) {
    return 0;
  }

  return Math.min(
    100,
    Math.round((matchedCount / totalCount) * 100)
  );
}

function getBudgetStatus(
  currentBudget: number,
  budgetGap: number
): BudgetAnalysis["budgetStatus"] {
  if (budgetGap === 0) {
    return "well_matched";
  }

  if (budgetGap <= currentBudget * UNDER_BUDGET_THRESHOLD) {
    return "under_budget";
  }

  return "over_budget";
}