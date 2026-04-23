import { Product, ParsedQuery } from "../types"

export function applyFilters(products: Product[], parsed: ParsedQuery) {
  return products.filter(p => {

    // 🔥 BUDGET FILTER (slight flexibility)
    if (parsed.budget && p.price > parsed.budget * 1.2) {
      return false
    }

    // 🔥 CATEGORY FILTER (safer)
    if (
      parsed.category &&
      parsed.category !== "general" &&
      p.category &&
      p.category !== parsed.category
    ) {
      return false
    }

    // =====================================================
    // 🔥 CONSTRAINT FILTERS (REAL INTELLIGENCE)
    // =====================================================

    if (parsed.constraints) {
      const specs = p.specs || {}

      // 🔥 RAM (strict + safe)
      if (
        parsed.constraints.minRam !== null &&
        parsed.constraints.minRam !== undefined &&
        (specs.ram || 0) < parsed.constraints.minRam
      ) {
        return false
      }

      // 🔥 BATTERY
      if (
        parsed.constraints.minBattery !== null &&
        parsed.constraints.minBattery !== undefined &&
        (specs.battery || 0) < parsed.constraints.minBattery
      ) {
        return false
      }

      // 🔥 RATING
      if (
        parsed.constraints.minRating !== null &&
        parsed.constraints.minRating !== undefined &&
        (p.rating || 0) < parsed.constraints.minRating
      ) {
        return false
      }
    }

    return true
  })
}