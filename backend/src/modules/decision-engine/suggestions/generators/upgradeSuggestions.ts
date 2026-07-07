import {
  BudgetAnalysis,
  Suggestion,
} from "../suggestion.types";

export function generateUpgradeSuggestions(
  analysis: BudgetAnalysis
): Suggestion[] {
  const suggestions: Suggestion[] = [];

  if (analysis.currentBudget === null) {
    return suggestions;
  }

  if (analysis.budgetGap <= 0) {
    return suggestions;
  }

  let priority: Suggestion["priority"] = "medium";

  if (analysis.budgetGap > 5000) {
    priority = "high";
  }

  suggestions.push({
    id: "budget-upgrade",
    category: "budget",
    priority,
    title: "Consider Increasing Your Budget",
    description: `Increasing your budget by ₹${analysis.budgetGap} (up to ₹${analysis.recommendedBudget}) can unlock ${analysis.unlockedProducts} additional matching products.`,
    confidence: 0.95,
    impactScore: Math.min(
      100,
      60 + analysis.unlockedProducts * 10
    ),
  });

  return suggestions;
}