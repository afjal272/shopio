import {
  Suggestion,
  SuggestionContext,
} from "../suggestion.types";

export function generateConstraintSuggestions(
  context: SuggestionContext
): Suggestion[] {
  const { parsed } = context;

  const suggestions: Suggestion[] = [];

  const constraints = parsed.constraints ?? {};

  if (constraints.minRam === undefined) {
    suggestions.push({
      id: "constraint-min-ram",
      category: "constraint",
      priority: "medium",
      title: "Specify Minimum RAM",
      description:
        "Adding a minimum RAM requirement helps improve performance-based recommendations.",
      confidence: 0.95,
      impactScore: 85,
    });
  }

  if (constraints.minBattery === undefined) {
    suggestions.push({
      id: "constraint-battery",
      category: "constraint",
      priority: "medium",
      title: "Specify Battery Requirement",
      description:
        "Mention a minimum battery capacity if battery life is important.",
      confidence: 0.95,
      impactScore: 75,
    });
  }

  if (constraints.minRating === undefined) {
    suggestions.push({
      id: "constraint-rating",
      category: "constraint",
      priority: "low",
      title: "Specify Minimum Rating",
      description:
        "Adding a minimum rating filters out lower-rated products.",
      confidence: 0.9,
      impactScore: 60,
    });
  }

  if (
    !constraints.preferredBrands ||
    constraints.preferredBrands.length === 0
  ) {
    suggestions.push({
      id: "constraint-brand",
      category: "constraint",
      priority: "low",
      title: "Choose Preferred Brands",
      description:
        "Selecting preferred brands can improve recommendation accuracy.",
      confidence: 0.9,
      impactScore: 50,
    });
  }

  if (
    !constraints.requiredTags ||
    constraints.requiredTags.length === 0
  ) {
    suggestions.push({
      id: "constraint-tags",
      category: "constraint",
      priority: "low",
      title: "Add Feature Preferences",
      description:
        "Specify features like AMOLED, 5G, IP Rating or Fast Charging for more accurate results.",
      confidence: 0.9,
      impactScore: 55,
    });
  }

  return suggestions;
}