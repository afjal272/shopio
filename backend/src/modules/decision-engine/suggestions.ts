export function generateSuggestions(parsed: any, isRelaxed: boolean) {
  const suggestions: string[] = []

  // 🔥 Budget improvement
  if (parsed.budget) {
    const increased = parsed.budget + 3000
    suggestions.push(`try under ₹${increased} for better options`)
  }

  // 🔥 Add constraints
  if (!parsed.constraints?.minRam) {
    suggestions.push("try adding 8GB RAM for better performance")
  }

  if (!parsed.intent?.includes("gaming")) {
    suggestions.push("try searching for gaming performance")
  }

  // 🔥 Relaxed mode hint
  if (isRelaxed) {
    suggestions.push("increase your budget for more accurate results")
  }

  return suggestions.slice(0, 3)
}