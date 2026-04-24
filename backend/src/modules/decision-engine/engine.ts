import { ParsedQuery, Product } from "./types"
import { applyFilters } from "./filters/applyFilters"
import { rankProducts } from "./ranking/rankProducts"
import { generateExplanation } from "./explanation/generateExplanation"
import { getRejectionReason } from "./explanation/getRejectionReason"
import { compareProducts } from "./comparison/compareProducts"
import { generateSuggestions } from "./suggestions" // 🔥 NEW

export function runEngine(parsed: ParsedQuery, products: Product[]) {

  // 🔥 CONVERT weightedIntent → simple intent
  const finalIntent =
    parsed.weightedIntent?.map((i) => i.type) || parsed.intent

  // 🔥 FILTER
  let filtered = applyFilters(products, parsed)

  // 🔥 FAIL-SAFE (IMPROVED)
  let isRelaxed = false

  if (filtered.length < 3) {
    console.log("⚠️ Low results → applying relaxed filter")

    isRelaxed = true

    filtered = products
      .sort((a, b) => {
        const diffA = Math.abs((a.price ?? 0) - (parsed.budget ?? 0))
        const diffB = Math.abs((b.price ?? 0) - (parsed.budget ?? 0))
        return diffA - diffB
      })
      .slice(0, 5)
  }

  // 🔥 (NEW) attach constraints to products
  const enriched = filtered.map((p) => ({
    ...p,
    __constraints: parsed.constraints
  }))

  // 🔥 RANK
  const ranked = rankProducts(
    enriched,
    parsed.weightedIntent || parsed.intent,
    isRelaxed ? null : parsed.budget,
    parsed.constraints
  )

  const best = ranked.length > 0 ? ranked[0] : null

  // SAFETY
  if (!best) {
    return {
      best: {
        id: "none",
        title: "No suitable product found",
        price: 0,
        rating: 0,
        image: "",
        score: 0,
        confidence: 0,
        explanation: "No products match your budget or requirements",
        tags: [],
        breakdown: {
          ram: 0,
          processor: 0,
          battery: 0,
          rating: 0
        }
      },
      top3: [],
      notRecommended: [],
      comparison: [],
      parsed,
      isRelaxed,
      suggestions: generateSuggestions(parsed, isRelaxed) // 🔥 NEW
    }
  }

  // 🔥 COMPARISON
  const comparison =
    ranked.length > 1
      ? compareProducts(
          ranked[0],
          ranked[1],
          finalIntent
        )
      : []

  return {
    best: {
      ...best,
      explanation: generateExplanation(
        best,
        finalIntent,
        parsed.constraints
      ),
      confidence: Math.min(100, Math.round(best.score || 0))
    },

    top3: ranked.slice(1, 9).map((p) => ({
      ...p,
      explanation: generateExplanation(
        p,
        finalIntent,
        parsed.constraints
      ),
      confidence: Math.min(100, Math.round(p.score || 0))
    })),

    notRecommended: ranked.slice(4, 7).map((p) => ({
      ...p,
      reason: getRejectionReason(
        p,
        finalIntent,
        parsed.budget,
        parsed.constraints
      )
    })),

    comparison,
    parsed,
    isRelaxed,
    suggestions: generateSuggestions(parsed, isRelaxed) // 🔥 NEW
  }
}