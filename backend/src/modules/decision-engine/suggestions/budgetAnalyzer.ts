import {
  AnalyzerResult,
  BudgetAnalysis,
  Suggestion,
  SuggestionContext,
} from "./suggestion.types"

// =======================================
// Constants
// =======================================

const IDEAL_BUDGET_UTILIZATION = 0.9

const HIGH_AFFORDABILITY = 90
const GOOD_AFFORDABILITY = 75
const FAIR_AFFORDABILITY = 60

const HIGH_IMPACT = 85
const MEDIUM_IMPACT = 65

// =======================================
// Private Types
// =======================================

interface BudgetStatistics {

  totalProducts: number

  matchedProducts: number

  averageMatchedPrice: number

  cheapestPrice: number

  highestPrice: number

  recommendedBudget: number | null

  budgetGap: number

  unlockedProducts: number

}

// =======================================
// Statistics
// =======================================

function collectStatistics(
  context: SuggestionContext
): BudgetStatistics {

  const {

    parsed,

    products,

    matchedProducts,

    bestProduct,

  } = context

  const currentBudget =
    parsed.budget

  const averageMatchedPrice =
    matchedProducts.length === 0
      ? 0
      : Math.round(

          matchedProducts.reduce(

            (sum, product) =>

              sum + product.price,

            0

          ) / matchedProducts.length

        )

  const cheapestPrice =
    products.length === 0
      ? 0
      : Math.min(
          ...products.map(
            p => p.price
          )
        )

  const highestPrice =
    products.length === 0
      ? 0
      : Math.max(
          ...products.map(
            p => p.price
          )
        )

  const recommendedBudget =
    bestProduct?.price ??
    averageMatchedPrice

  const budgetGap =
    currentBudget && recommendedBudget
      ? Math.max(
          0,
          recommendedBudget -
            currentBudget
        )
      : 0

  const unlockedProducts =
    currentBudget && recommendedBudget
      ? products.filter(

          p =>

            p.price >
              currentBudget &&

            p.price <=
              recommendedBudget

        ).length
      : 0

  return {

    totalProducts:
      products.length,

    matchedProducts:
      matchedProducts.length,

    averageMatchedPrice,

    cheapestPrice,

    highestPrice,

    recommendedBudget,

    budgetGap,

    unlockedProducts,

  }

}

// =======================================
// Affordability
// =======================================

function analyzeAffordability(

  currentBudget: number | null,

  recommendedBudget: number | null

): number {

  if (
    !currentBudget ||
    !recommendedBudget
  ) {
    return 100
  }

  if (
    recommendedBudget <=
    currentBudget
  ) {
    return 100
  }

  const utilization =
    currentBudget /
    recommendedBudget

  const score =
    utilization *
    100 /
    IDEAL_BUDGET_UTILIZATION

  return Math.max(
    0,
    Math.min(
      100,
      Math.round(score)
    )
  )

}

// =======================================
// Budget Gap
// =======================================

function analyzeBudgetGap(

  statistics: BudgetStatistics

): BudgetAnalysis {

  return {

    currentBudget: null,

    recommendedBudget:
      statistics.recommendedBudget,

    budgetGap:
      statistics.budgetGap,

    affordabilityScore: 0,

    averageMatchedPrice:
      statistics.averageMatchedPrice,

    unlockedProducts:
      statistics.unlockedProducts,

  }

}