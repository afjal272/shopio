import {
  BudgetAnalysis,
  Suggestion,
} from "../suggestion.types";

export function generateBudgetSuggestions(
  analysis: BudgetAnalysis
): Suggestion[] {
  const suggestions: Suggestion[] = [];

  if (analysis.currentBudget === null) {
    suggestions.push({
      id: "budget-missing",
      category: "budget",
      priority: "medium",
      title: "Add a Budget",
      description:
        "Specify your budget to receive more accurate recommendations.",
      confidence: 1,
      impactScore: 90,
    });

    return suggestions;
  }

  if (analysis.budgetGap > 0) {
    suggestions.push({
      id: "increase-budget",
      category: "budget",
      priority:
        analysis.budgetStatus === "under_budget"
          ? "medium"
          : "high",
      title: "Increase Your Budget",
      description: `Increase your budget by ₹${analysis.budgetGap} (up to ₹${analysis.recommendedBudget}) to unlock ${analysis.unlockedProducts} more matching products.`,
      confidence: 0.95,
      impactScore: Math.min(100, analysis.unlockedProducts * 20),
    });
  }

  if (analysis.affordabilityScore >= 80) {
    suggestions.push({
      id: "budget-good",
      category: "budget",
      priority: "low",
      title: "Budget Looks Good",
      description:
        "Your current budget already covers most matching products.",
      confidence: 0.9,
      impactScore: 40,
    });
  }

  return suggestions;
}