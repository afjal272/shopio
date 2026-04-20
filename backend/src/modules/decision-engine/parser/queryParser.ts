import { ParsedQuery, IntentType } from "../types"

export function parseQuery(query: string): ParsedQuery {
  const q = query.toLowerCase()

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
      budget = Number(raw.replace("k", "")) * 1000
    } else {
      budget = Number(raw.replace(/,/g, ""))
    }
  }

  // 🔥 STRICT INTENT TYPE
  const intent: IntentType[] = []

  const intentMap: Record<IntentType, string[]> = {
    gaming: ["gaming", "game", "pubg", "bgmi", "fps", "heavy gaming"],
    camera: ["camera", "photo", "photography", "video", "selfie"],
    battery: ["battery", "backup", "long lasting", "power", "long battery"],
    balanced: []
  }

  // 🔍 SMART MATCH (word boundary)
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

  // ⚡ DEFAULT
  if (uniqueIntent.length === 0) {
    uniqueIntent.push("balanced")
  }

  return {
    category: "smartphone",
    budget,
    intent: uniqueIntent
  }
}