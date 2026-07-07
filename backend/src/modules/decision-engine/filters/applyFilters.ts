import { ParsedQuery, Product } from "../types"

import {
  includesAll,
  includesAny,
  isBrandAllowed,
  isCategoryMatch,
  isWithinBudget,
} from "./filter.utils"

export function applyFilters(
  products: Product[],
  parsed: ParsedQuery
): Product[] {
  return products.filter((product) => {
    const specs = product.specs
    const tags = product.tags
    const constraints = parsed.constraints

    if (!isWithinBudget(product.price, parsed.budget)) {
      return false
    }

    if (!isCategoryMatch(product.category, parsed.category)) {
      return false
    }

    if (constraints) {
      if (
        constraints.minRam !== undefined &&
        (specs.ram ?? 0) < constraints.minRam
      ) {
        return false
      }

      if (
        constraints.maxRam !== undefined &&
        (specs.ram ?? 0) > constraints.maxRam
      ) {
        return false
      }

      if (
        constraints.minBattery !== undefined &&
        (specs.battery ?? 0) < constraints.minBattery
      ) {
        return false
      }

      if (
        constraints.maxBattery !== undefined &&
        (specs.battery ?? 0) > constraints.maxBattery
      ) {
        return false
      }

      if (
        constraints.minRating !== undefined &&
        (product.rating ?? 0) < constraints.minRating
      ) {
        return false
      }

      if (
        constraints.maxRating !== undefined &&
        (product.rating ?? 0) > constraints.maxRating
      ) {
        return false
      }

      if (
        constraints.minPrice !== undefined &&
        product.price < constraints.minPrice
      ) {
        return false
      }

      if (
        constraints.maxPrice !== undefined &&
        product.price > constraints.maxPrice
      ) {
        return false
      }

      if (
        !isBrandAllowed(
          product.brand,
          constraints.preferredBrands,
          constraints.excludedBrands
        )
      ) {
        return false
      }

      if (
        constraints.requiredTags?.length &&
        !includesAll(tags, constraints.requiredTags)
      ) {
        return false
      }

      if (
        constraints.excludedTags?.length &&
        includesAny(tags, constraints.excludedTags)
      ) {
        return false
      }
    }

    return true
  })
}