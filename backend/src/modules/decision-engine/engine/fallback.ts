import { ParsedQuery, Product } from "../types";

import { CANDIDATE, FALLBACK } from "./engine.constants";
import { FallbackResult } from "./engine.types";

export function applyFallback(
  filteredProducts: Product[],
  allProducts: Product[],
  parsed: ParsedQuery
): FallbackResult {
  // =====================================================
  // Level 0
  // Enough products found
  // =====================================================

  if (filteredProducts.length >= CANDIDATE.MIN_RESULTS) {
    return {
      products: filteredProducts,
      isRelaxed: false,
      level: 0,
      appliedRules: [],
    };
  }

  const appliedRules: string[] = [];

  // =====================================================
  // Level 1
  // Relax budget slightly
  // =====================================================

  if (parsed.budget !== null) {
    const relaxedBudget = Math.round(
      parsed.budget *
        (1 + FALLBACK.PRICE_RELAXATION_PERCENT)
    );

    const relaxedProducts = allProducts
      .filter((product) => product.price <= relaxedBudget)
      .sort(sortByPrice);

    if (
      relaxedProducts.length >=
      CANDIDATE.MIN_RESULTS
    ) {
      appliedRules.push(
        `Budget relaxed by ${
          FALLBACK.PRICE_RELAXATION_PERCENT * 100
        }%`
      );

      return {
        products: relaxedProducts.slice(
          0,
          FALLBACK.MAX_RELAXED_RESULTS
        ),

        isRelaxed: true,

        level: 1,

        appliedRules,
      };
    }
  }

  // =====================================================
  // Level 2
  // Smart Recovery
  // =====================================================

  appliedRules.push(
    "Showing closest products within available inventory"
  );

  const recoveredProducts = [...allProducts]
    .sort((a, b) =>
      sortByNearestBudget(
        a,
        b,
        parsed.budget
      )
    )
    .slice(0, FALLBACK.MAX_RELAXED_RESULTS);

  return {
    products: recoveredProducts,

    isRelaxed: true,

    level: 2,

    appliedRules,
  };
}

// =====================================================
// Helpers
// =====================================================

function sortByPrice(
  a: Product,
  b: Product
): number {
  return a.price - b.price;
}

function sortByNearestBudget(
  a: Product,
  b: Product,
  budget: number | null
): number {
  const target = budget ?? 0;

  const diffA = Math.abs(a.price - target);

  const diffB = Math.abs(b.price - target);

  if (diffA !== diffB) {
    return diffA - diffB;
  }

  return b.rating - a.rating;
}