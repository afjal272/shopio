import { ParsedQuery, IntentType } from "../types"

export function parseQuery(query: string): ParsedQuery {
  const q = query.toLowerCase()

  // 💰 Budget extract
  const budgetMatch =
    q.match(/under\s?(\d+)/) ||
    q.match(/below\s?(\d+)/) ||
    q.match(/(\d+)\s?k/)

  let budget: number | null = null

  if (budgetMatch) {
    const value = Number(budgetMatch[1])
    budget = q.includes("k") ? value * 1000 : value
  }

  // 🔥 STRICT INTENT TYPE
  const intent: IntentType[] = []

  // 🔥 INTENT MAP (ONLY VALID TYPES)
  const intentMap: Record<IntentType, string[]> = {
    gaming: ["gaming", "game", "pubg", "bgmi", "fps"],
    camera: ["camera", "photo", "photography", "video"],
    battery: ["battery", "backup", "long lasting", "power"],
    balanced: [] // default
  }

  // 🔍 DETECT INTENTS
  Object.entries(intentMap).forEach(([key, keywords]) => {
    if (keywords.some((word) => q.includes(word))) {
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