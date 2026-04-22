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

  // 🔥 CATEGORY DETECTION (basic but needed)
  let category: ParsedQuery["category"] = "general"

  if (q.includes("phone") || q.includes("mobile")) {
    category = "smartphone"
  } else if (q.includes("laptop")) {
    category = "laptop"
  }

  // 🔥 STRICT INTENT TYPE
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

  return {
    category,
    budget,
    intent: uniqueIntent
  }
}