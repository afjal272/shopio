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
  // 🔥 NEW: NEGATIVE INTENT (NO BREAKING CHANGE)
  // =====================================================

  const negativeIntent: IntentType[] = []

  const negativePatterns = [
    /not\s+for\s+(\w+)/i,
    /no\s+(\w+)/i,
    /avoid\s+(\w+)/i,
  ]

  negativePatterns.forEach((pattern) => {
    const match = q.match(pattern)
    if (match) {
      const word = match[1]

      Object.entries(intentMap).forEach(([key, keywords]) => {
        if (keywords.includes(word)) {
          negativeIntent.push(key as IntentType)
        }
      })
    }
  })

  // 🔥 REMOVE NEGATIVE FROM INTENT
  const filteredIntent = uniqueIntent.filter(
    (i) => !negativeIntent.includes(i)
  )

  if (filteredIntent.length === 0) {
    filteredIntent.push("balanced")
  }

  // =====================================================
  // 🔥 NEW: WEIGHTED INTENT SYSTEM
  // =====================================================

  const intentWeights: Record<IntentType, number> = {
    gaming: 0,
    camera: 0,
    battery: 0,
    balanced: 0
  }

  Object.entries(intentMap).forEach(([key, keywords]) => {
    keywords.forEach((word) => {
      const regex = new RegExp(`\\b${word}\\b`, "gi")
      const matches = q.match(regex)
      if (matches) {
        intentWeights[key as IntentType] += matches.length
      }
    })
  })

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

  // 🔥 FILTER NEGATIVE FROM WEIGHTED
  weightedIntent = weightedIntent.filter(
    (i) => !negativeIntent.includes(i.type)
  )

  if (weightedIntent.length === 0) {
    weightedIntent = [{ type: "balanced", weight: 1 }]
  }

  // =====================================================
  // 🔥 NEW: CONSTRAINTS PARSER (ADDED)
  // =====================================================

  const constraints = {
    minRam: null as number | null,
    minBattery: null as number | null,
    minRating: null as number | null
  }

  // RAM (e.g. 8GB)
  const ramMatch = q.match(/(\d+)\s?gb/)
  if (ramMatch) {
    const val = Number(ramMatch[1])
    if (!isNaN(val)) constraints.minRam = val
  }

  // Battery (e.g. 6000mAh)
  const batteryMatch = q.match(/(\d+)\s?mah/)
  if (batteryMatch) {
    const val = Number(batteryMatch[1])
    if (!isNaN(val)) constraints.minBattery = val
  }

  // Rating (e.g. 4.5 rating)
  const ratingMatch = q.match(/(\d+(\.\d+)?)\s?(rating|stars?)/)
  if (ratingMatch) {
    const val = Number(ratingMatch[1])
    if (!isNaN(val)) constraints.minRating = val
  }

  // =====================================================
  // FINAL RETURN
  // =====================================================

  return {
    category,
    budget,
    intent: filteredIntent,
    weightedIntent,
    negativeIntent,
    constraints
  }
}