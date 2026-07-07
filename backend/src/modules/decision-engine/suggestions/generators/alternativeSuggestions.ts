import {
  Suggestion,
  SuggestionContext,
} from "../suggestion.types";

export function generateAlternativeSuggestions(
  context: SuggestionContext
): Suggestion[] {
  const { rankedProducts, bestProduct } = context;

  if (!bestProduct || rankedProducts.length <= 1) {
    return [];
  }

  const suggestions: Suggestion[] = [];

  const alternatives = rankedProducts
    .filter((product) => product.id !== bestProduct.id)
    .slice(0, 2);

  for (const product of alternatives) {
    suggestions.push({
      id: `alternative-${product.id}`,
      category: "alternative",
      priority: "medium",
      title: `Consider ${product.name}`,
      description: `${product.name} by ${product.brand} is another strong option within your search criteria.`,
      confidence: product.confidence ?? 0.9,
      impactScore: Math.round(product.score ?? 80),
    });
  }

  return suggestions;
}