import { ParsedQuery } from "../types"

export function parseQuery(query: string): ParsedQuery {
  const q = query.toLowerCase()

  // 💰 Budget extract (under 20000, below 20k, 20k, etc)
  const budgetMatch =
    q.match(/under\s?(\d+)/) ||
    q.match(/below\s?(\d+)/) ||
    q.match(/(\d+)\s?k/)

  let budget: number | null = null

  if (budgetMatch) {
    const value = Number(budgetMatch[1])
    budget = q.includes("k") ? value * 1000 : value
  }

  const intent: string[] = []

  // 🔥 INTENT MAP (SCALABLE SYSTEM)
  const intentMap: Record<string, string[]> = {
    gaming: ["gaming", "game", "pubg", "bgmi", "fps"],
    camera: ["camera", "photo", "photography", "video"],
    battery: ["battery", "backup", "long lasting", "power"],
    performance: ["fast", "performance", "smooth"]
  }

  // 🔍 DETECT INTENTS
  Object.entries(intentMap).forEach(([key, keywords]) => {
    if (keywords.some((word) => q.includes(word))) {
      intent.push(key)
    }
  })

  // 🔥 REMOVE DUPLICATES (safety)
  const uniqueIntent = [...new Set(intent)]

  // ⚡ DEFAULT INTENT
  if (uniqueIntent.length === 0) {
    uniqueIntent.push("balanced")
  }

  return {
    category: "smartphone",
    budget,
    intent: uniqueIntent
  }
}