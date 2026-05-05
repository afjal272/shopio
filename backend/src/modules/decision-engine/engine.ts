import { ParsedQuery, Product } from "./types"
import { applyFilters } from "./filters/applyFilters"
import { rankProducts } from "./ranking/rankProducts"
import { generateExplanation } from "./explanation/generateExplanation"
import { getRejectionReason } from "./explanation/getRejectionReason"
import { compareProducts } from "./comparison/compareProducts"
import { generateSuggestions } from "./suggestions"

// 🔥 ADD: SAFE MAPPER (no external file needed)
function mapProduct(p: any) {
  return {
    ...p,

    // ✅ normalize name
    name: p.name || p.title || "Unknown",

    // ✅ normalize images
    images: p.images || (p.image ? [p.image] : []),

    // ✅ safety defaults
    price: p.price ?? 0,
    rating: p.rating ?? 0,
    specs: p.specs ?? {},
    tags: p.tags ?? [],
    score: p.score ?? 0,
    confidence: p.confidence ?? 0,
  }
}

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

  // 🔥 attach constraints
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

  // 🔴 SAFETY
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
      comparison: {
        winner: null,
        reasons: [],
        scores: []
      },
      parsed,
      isRelaxed,
      suggestions: generateSuggestions(parsed, isRelaxed)
    }
  }

  // 🔥 FIXED COMPARISON (multi-product, no crash)
  const comparison =
    ranked.length > 1
      ? compareProducts(
          ranked.slice(0, 4), // 🔥 top 2–4 products
          finalIntent
        )
      : {
          winner: null,
          reasons: [],
          scores: []
        }

  return {
    best: {
      ...mapProduct(best), // ✅ FIX
      explanation: generateExplanation(
        best,
        finalIntent,
        parsed.constraints
      ),
      confidence: Math.min(100, Math.round(best.score || 0))
    },

    top3: ranked.slice(1, 9).map((p) => ({
      ...mapProduct(p), // ✅ FIX
      explanation: generateExplanation(
        p,
        finalIntent,
        parsed.constraints
      ),
      confidence: Math.min(100, Math.round(p.score || 0))
    })),

    notRecommended: ranked.slice(4, 7).map((p) => ({
      id: p.id,
      name: (p as any).name || (p as any).title || "Unknown product", // ✅ already correct
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
    suggestions: generateSuggestions(parsed, isRelaxed)
  }
}