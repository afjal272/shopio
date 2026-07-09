import { ParsedQuery, Product } from "../types";

import { CANDIDATE, FALLBACK } from "./engine.constants";
import { FallbackResult } from "./engine.types";

// ======================================================
// Fallback Engine
// ======================================================

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
  // Relax Budget
  // =====================================================

  if (parsed.budget !== null) {

    const relaxedBudget = Math.round(

      parsed.budget *

      (1 + FALLBACK.PRICE_RELAXATION_PERCENT)

    );

    const relaxedProducts = allProducts

      .filter(product => product.price <= relaxedBudget)

      .sort(sortByPriceThenRating);

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
  // Closest Match Recovery
  // =====================================================

  appliedRules.push(

    "Showing closest matching products"

  );

  const recoveredProducts = [...allProducts]

    .sort((a, b) =>

      sortByNearestBudget(

        a,

        b,

        parsed.budget

      )

    )

    .slice(

      0,

      FALLBACK.MAX_RELAXED_RESULTS

    );

  return {

    products: recoveredProducts,

    isRelaxed: true,

    level: 2,

    appliedRules,

  };

}

// ======================================================
// Helpers
// ======================================================

function sortByPriceThenRating(

  a: Product,

  b: Product

): number {

  if (a.price !== b.price) {

    return a.price - b.price;

  }

  return b.rating - a.rating;

}

function sortByNearestBudget(

  a: Product,

  b: Product,

  budget: number | null

): number {

  const target = budget ?? 0;

  const diffA = Math.abs(

    a.price - target

  );

  const diffB = Math.abs(

    b.price - target

  );

  if (diffA !== diffB) {

    return diffA - diffB;

  }

  if (b.rating !== a.rating) {

    return b.rating - a.rating;

  }

  return b.reviewsCount - a.reviewsCount;

}