import { ParsedQuery } from "../types"

export function parseQuery(query: string): ParsedQuery {
  const q = query.toLowerCase()

  // 💰 Budget extract (handles: under 20000, below 20k, etc)
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

  // 🎮 GAMING
  if (
    q.includes("gaming") ||
    q.includes("game") ||
    q.includes("pubg") ||
    q.includes("bgmi")
  ) {
    intent.push("gaming")
  }

  // 📸 CAMERA
  if (
    q.includes("camera") ||
    q.includes("photo") ||
    q.includes("photography")
  ) {
    intent.push("camera")
  }

  // 🔋 BATTERY
  if (
    q.includes("battery") ||
    q.includes("backup") ||
    q.includes("long lasting")
  ) {
    intent.push("battery")
  }

  // ⚡ DEFAULT INTENT (IMPORTANT FIX)
  if (intent.length === 0) {
    intent.push("balanced")
  }

  return {
    category: "smartphone",
    budget,
    intent
  }
}