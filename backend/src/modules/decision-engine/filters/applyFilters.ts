import { ParsedQuery, Product } from "../types";

import {
  FilterResult,
  RejectedProduct,
} from "./filter.types";

import {
  includesAll,
  includesAny,
  isBrandAllowed,
  isCategoryMatch,
  isWithinBudget,
} from "./filter.utils";

// ======================================================
// Apply Filters
// ======================================================

export function applyFilters(
  products: Product[],
  parsed: ParsedQuery
): FilterResult {

  const matchedProducts: Product[] = [];

  const rejectedProducts: RejectedProduct[] = [];

  for (const product of products) {

    const specs = product.specs;

    const tags = product.tags;

    const constraints = parsed.constraints;

    // ==================================================
    // Budget
    // ==================================================

    if (!isWithinBudget(product.price, parsed.budget)) {

      rejectedProducts.push({

        product,

        stage: "budget",

        reason: `Over budget (₹${product.price})`,

      });

      continue;

    }

    // ==================================================
    // Category
    // ==================================================

    if (!isCategoryMatch(product.category, parsed.category)) {

      rejectedProducts.push({

        product,

        stage: "category",

        reason: "Category doesn't match",

      });

      continue;

    }

    // ==================================================
    // Constraints
    // ==================================================

    if (constraints) {

      // ------------------------------
      // RAM
      // ------------------------------

      if (

        constraints.minRam !== undefined &&

        (specs.ram ?? 0) < constraints.minRam

      ) {

        rejectedProducts.push({

          product,

          stage: "constraint",

          reason: `Requires at least ${constraints.minRam} GB RAM`,

        });

        continue;

      }

      if (

        constraints.maxRam !== undefined &&

        (specs.ram ?? 0) > constraints.maxRam

      ) {

        rejectedProducts.push({

          product,

          stage: "constraint",

          reason: `RAM exceeds ${constraints.maxRam} GB`,

        });

        continue;

      }

      // ------------------------------
      // Battery
      // ------------------------------

      if (

        constraints.minBattery !== undefined &&

        (specs.battery ?? 0) < constraints.minBattery

      ) {

        rejectedProducts.push({

          product,

          stage: "constraint",

          reason: `Battery below ${constraints.minBattery} mAh`,

        });

        continue;

      }

      if (

        constraints.maxBattery !== undefined &&

        (specs.battery ?? 0) > constraints.maxBattery

      ) {

        rejectedProducts.push({

          product,

          stage: "constraint",

          reason: `Battery exceeds ${constraints.maxBattery} mAh`,

        });

        continue;

      }

          // ------------------------------
      // Rating
      // ------------------------------

      if (

        constraints.minRating !== undefined &&

        (product.rating ?? 0) < constraints.minRating

      ) {

        rejectedProducts.push({

          product,

          stage: "constraint",

          reason: `Rating below ${constraints.minRating}`,

        });

        continue;

      }

      if (

        constraints.maxRating !== undefined &&

        (product.rating ?? 0) > constraints.maxRating

      ) {

        rejectedProducts.push({

          product,

          stage: "constraint",

          reason: `Rating exceeds ${constraints.maxRating}`,

        });

        continue;

      }

      // ------------------------------
      // Price
      // ------------------------------

      if (

        constraints.minPrice !== undefined &&

        product.price < constraints.minPrice

      ) {

        rejectedProducts.push({

          product,

          stage: "constraint",

          reason: `Price below ₹${constraints.minPrice}`,

        });

        continue;

      }

      if (

        constraints.maxPrice !== undefined &&

        product.price > constraints.maxPrice

      ) {

        rejectedProducts.push({

          product,

          stage: "constraint",

          reason: `Price above ₹${constraints.maxPrice}`,

        });

        continue;

      }

      // ------------------------------
      // Brand
      // ------------------------------

      if (

        !isBrandAllowed(

          product.brand,

          constraints.preferredBrands,

          constraints.excludedBrands

        )

      ) {

        rejectedProducts.push({

          product,

          stage: "constraint",

          reason: "Brand preference mismatch",

        });

        continue;

      }

      // ------------------------------
      // Required Tags
      // ------------------------------

      if (

        constraints.requiredTags?.length &&

        !includesAll(

          tags,

          constraints.requiredTags

        )

      ) {

        rejectedProducts.push({

          product,

          stage: "constraint",

          reason: "Missing required features",

        });

        continue;

      }

      // ------------------------------
      // Excluded Tags
      // ------------------------------

      if (

        constraints.excludedTags?.length &&

        includesAny(

          tags,

          constraints.excludedTags

        )

      ) {

        rejectedProducts.push({

          product,

          stage: "constraint",

          reason: "Contains excluded features",

        });

        continue;

      }

    }

    // ==================================================
    // Passed All Filters
    // ==================================================

    matchedProducts.push(product);

  }

  // ====================================================
  // Final Result
  // ====================================================

  return {

    matchedProducts,

    rejectedProducts,

  };

}