import {
  Suggestion,
  SuggestionContext,
} from "../suggestion.types";

export function generateRelaxedSuggestions(
  context: SuggestionContext
): Suggestion[] {
  const { isRelaxed, matchedProducts, parsed } = context;

  if (!isRelaxed) {
    return [];
  }

  const suggestions: Suggestion[] = [];

  suggestions.push({
    id: "relaxed-search",
    category: "relaxed",
    priority: "high",
    title: "Search Was Relaxed",
    description:
      "Your original filters were too restrictive, so some constraints were relaxed to find better matches.",
    confidence: 1,
    impactScore: 95,
  });

  if (matchedProducts.length === 0) {
    suggestions.push({
      id: "relaxed-no-results",
      category: "relaxed",
      priority: "critical",
      title: "No Exact Matches Found",
      description:
        "Try increasing your budget or removing some constraints to discover more products.",
      confidence: 1,
      impactScore: 100,
    });
  }

  if (parsed.budget !== null) {
    suggestions.push({
      id: "relaxed-budget",
      category: "relaxed",
      priority: "medium",
      title: "Increase Budget",
      description:
        "A slightly higher budget can significantly improve available options.",
      confidence: 0.9,
      impactScore: 75,
    });
  }

  return suggestions;
}