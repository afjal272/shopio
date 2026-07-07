import {
  Suggestion,
  SuggestionContext,
} from "../suggestion.types";

export function generateIntentSuggestions(
  context: SuggestionContext
): Suggestion[] {
  const { parsed } = context;

  const suggestions: Suggestion[] = [];

  const intents = parsed.intent ?? [];

  // No intent detected
  if (intents.length === 0) {
    suggestions.push({
      id: "intent-missing",
      category: "intent",
      priority: "high",
      title: "Specify Your Priority",
      description:
        "Tell us whether you care most about gaming, camera, battery or balanced performance.",
      confidence: 1,
      impactScore: 95,
    });

    return suggestions;
  }

  // Too many intents
  if (intents.length > 2) {
    suggestions.push({
      id: "intent-multiple",
      category: "intent",
      priority: "medium",
      title: "Focus on One Priority",
      description:
        "Choosing fewer priorities helps generate more accurate recommendations.",
      confidence: 0.95,
      impactScore: 80,
    });
  }

  // Balanced search
  if (intents.includes("balanced")) {
    suggestions.push({
      id: "intent-balanced",
      category: "intent",
      priority: "low",
      title: "Be More Specific",
      description:
        "Mention gaming, camera or battery if you have a primary preference.",
      confidence: 0.9,
      impactScore: 60,
    });
  }

  // Missing weighted intent
  if (
    !parsed.weightedIntent ||
    parsed.weightedIntent.length === 0
  ) {
    suggestions.push({
      id: "intent-weight",
      category: "intent",
      priority: "low",
      title: "Add More Details",
      description:
        "A more descriptive search helps the engine understand your priorities better.",
      confidence: 0.9,
      impactScore: 55,
    });
  }

  return suggestions;
}