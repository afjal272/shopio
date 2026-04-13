import { ParsedQuery } from "../types"

export function parseQuery(query: string): ParsedQuery {
  const q = query.toLowerCase()

  const budgetMatch = q.match(/under\s?(\d+)/)
  const budget = budgetMatch ? Number(budgetMatch[1]) : null

  const intent: string[] = []

  if (q.includes("gaming")) intent.push("gaming")
  if (q.includes("camera")) intent.push("camera")
  if (q.includes("battery")) intent.push("battery")

  return {
    category: "smartphone",
    budget,
    intent
  }
}