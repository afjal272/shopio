import { Product, ParsedQuery } from "../types"

export function applyFilters(products: Product[], parsed: ParsedQuery) {
  return products.filter(p => {

    // 🔥 BUDGET FILTER (slight flexibility)
    if (parsed.budget && p.price > parsed.budget * 1.2) {
      return false
    }

    // 🔥 CATEGORY FILTER
    if (parsed.category === "smartphone" && p.category !== "smartphone") {
      return false
    }

    if (parsed.category === "laptop" && p.category !== "laptop") {
      return false
    }

    // =====================================================
    // 🔥 CONSTRAINT FILTERS (REAL INTELLIGENCE)
    // =====================================================

    if (parsed.constraints) {
      const specs = p.specs || {}

      // RAM
      if (parsed.constraints.minRam && (specs.ram || 0) < parsed.constraints.minRam) {
        return false
      }

      // BATTERY
      if (parsed.constraints.minBattery && (specs.battery || 0) < parsed.constraints.minBattery) {
        return false
      }

      // RATING
      if (parsed.constraints.minRating && (p.rating || 0) < parsed.constraints.minRating) {
        return false
      }
    }

    return true
  })
}