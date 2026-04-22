import { ParsedQuery, IntentType } from "../types"

export function parseQuery(query: string): ParsedQuery {
  const q = query.toLowerCase().trim()

  // 🔥 IMPROVED BUDGET PARSER
  const budgetMatch =
    q.match(/under\s?₹?\s?(\d+[kK]?)/) ||
    q.match(/below\s?₹?\s?(\d+[kK]?)/) ||
    q.match(/₹\s?(\d+)/) ||
    q.match(/(\d+[kK])/)

  let budget: number | null = null

  if (budgetMatch) {
    const raw = budgetMatch[1].toLowerCase()

    if (raw.includes("k")) {
      const num = Number(raw.replace("k", ""))
      if (!isNaN(num)) budget = num * 1000
    } else {
      const num = Number(raw.replace(/,/g, ""))
      if (!isNaN(num)) budget = num
    }
  }

  // 🔥 CATEGORY DETECTION
  let category: ParsedQuery["category"] = "general"

  if (q.includes("phone") || q.includes("mobile")) {
    category = "smartphone"
  } else if (q.includes("laptop")) {
    category = "laptop"
  }

  // 🔥 STRICT INTENT TYPE (existing logic preserved)
  const intent: IntentType[] = []

  const intentMap: Record<IntentType, string[]> = {
    gaming: ["gaming", "game", "pubg", "bgmi", "fps", "heavy gaming"],
    camera: ["camera", "photo", "photography", "video", "selfie"],
    battery: ["battery", "backup", "long lasting", "power", "long battery"],
    balanced: []
  }

  Object.entries(intentMap).forEach(([key, keywords]) => {
    if (
      keywords.some((word) => {
        const regex = new RegExp(`\\b${word}\\b`, "i")
        return regex.test(q)
      })
    ) {
      intent.push(key as IntentType)
    }
  })

  // 🔥 REMOVE DUPLICATES
  const uniqueIntent: IntentType[] = [...new Set(intent)]

  // ⚡ DEFAULT FALLBACK
  if (uniqueIntent.length === 0) {
    uniqueIntent.push("balanced")
  }

  // =====================================================
  // 🔥 NEW: WEIGHTED INTENT SYSTEM (NO BREAKING CHANGE)
  // =====================================================

  const intentWeights: Record<IntentType, number> = {
    gaming: 0,
    camera: 0,
    battery: 0,
    balanced: 0
  }

  // Count keyword matches (frequency based weight)
  Object.entries(intentMap).forEach(([key, keywords]) => {
    keywords.forEach((word) => {
      const regex = new RegExp(`\\b${word}\\b`, "gi")
      const matches = q.match(regex)
      if (matches) {
        intentWeights[key as IntentType] += matches.length
      }
    })
  })

  // Normalize weights
  const totalWeight = Object.values(intentWeights).reduce((a, b) => a + b, 0)

  let weightedIntent: { type: IntentType; weight: number }[] = []

  if (totalWeight === 0) {
    weightedIntent = [{ type: "balanced", weight: 1 }]
  } else {
    weightedIntent = Object.entries(intentWeights)
      .filter(([_, value]) => value > 0)
      .map(([key, value]) => ({
        type: key as IntentType,
        weight: value / totalWeight
      }))
  }

  // =====================================================
  // FINAL RETURN (BACKWARD + FORWARD COMPATIBLE)
  // =====================================================

  return {
    category,
    budget,

    // OLD SYSTEM (keep for compatibility)
    intent: uniqueIntent,

    // NEW SYSTEM (for advanced scoring)
    weightedIntent
  }
}