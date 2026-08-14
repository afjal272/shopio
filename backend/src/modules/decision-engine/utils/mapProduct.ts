import { Prisma } from "@prisma/client";

import {
  CategoryType,
  Product,
  ProductSpecs,
} from "../types";

// ======================================================
// Prisma Product Payload
// ======================================================

type PrismaProductWithOffers = Prisma.ProductGetPayload<{
  include: {
    offers: true;
  };
}>;

// ======================================================
// Configuration
// ======================================================

/**
 * An offer older than this threshold is considered stale
 * and must not influence the Decision Engine price.
 *
 * The actual marketplace synchronization frequency can be
 * changed later without changing the engine architecture.
 */
const MAX_OFFER_AGE_MS = 24 * 60 * 60 * 1000;

// ======================================================
// Public Mapper
// ======================================================

export function mapProduct(
  product: PrismaProductWithOffers
): Product {
  return {
    id: product.id,

    name: normalizeName(product.name),

    brand: normalizeName(product.brand),

    category: normalizeCategory(product.category),

    description: product.description,

    /**
     * The Decision Engine receives an effective current price.
     *
     * Priority:
     * 1. Lowest fresh marketplace offer
     * 2. Existing Product.price fallback
     */
    price: resolveEffectivePrice(product),

    rating: normalizeRating(product.rating),

    reviewsCount: normalizeReviewsCount(
      product.reviewsCount
    ),

    images: normalizeImages(product.images),

    tags: normalizeStringArray(product.tags),

    highlights: normalizeStringArray(
      product.highlights
    ),

    weaknesses: normalizeStringArray(
      product.weaknesses
    ),

    specs: normalizeSpecs(product.specs),
  };
}

// ======================================================
// Effective Price
// ======================================================

function resolveEffectivePrice(
  product: PrismaProductWithOffers
): number {
  const now = Date.now();

  const freshPrices = product.offers
    .filter((offer) => {
      const price = normalizePositiveInteger(
        offer.price
      );

      if (price === null) {
        return false;
      }

      const updatedAt =
        offer.updatedAt.getTime();

      const age =
        now - updatedAt;

      return (
        age >= 0 &&
        age <= MAX_OFFER_AGE_MS
      );
    })
    .map((offer) => offer.price);

  if (freshPrices.length > 0) {
    return Math.min(...freshPrices);
  }

  return Math.max(
    0,
    product.price
  );
}

// ======================================================
// Name
// ======================================================

function normalizeName(
  value: string
): string {
  const normalized = value.trim();

  return normalized.length > 0
    ? normalized
    : "Unknown Product";
}

// ======================================================
// Category
// ======================================================

function normalizeCategory(
  value: string
): CategoryType {
  const normalized =
    value.trim().toLowerCase();

  if (
    normalized === "smartphone" ||
    normalized === "laptop" ||
    normalized === "general"
  ) {
    return normalized;
  }

  return "general";
}

// ======================================================
// Rating
// ======================================================

function normalizeRating(
  value: number
): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.min(
    5,
    Math.max(0, value)
  );
}

// ======================================================
// Reviews
// ======================================================

function normalizeReviewsCount(
  value: number
): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(
    0,
    Math.floor(value)
  );
}

// ======================================================
// Images
// ======================================================

function normalizeImages(
  images: string[]
): string[] {
  return images
    .filter(
      (image): image is string =>
        typeof image === "string"
    )
    .map((image) => image.trim())
    .filter(Boolean);
}

// ======================================================
// String Arrays
// ======================================================

function normalizeStringArray(
  values: string[]
): string[] {
  return values
    .filter(
      (value): value is string =>
        typeof value === "string"
    )
    .map((value) => value.trim())
    .filter(Boolean);
}

// ======================================================
// Specifications
// ======================================================

function normalizeSpecs(
  value: Prisma.JsonValue
): ProductSpecs {
  if (
    typeof value !== "object" ||
    value === null ||
    Array.isArray(value)
  ) {
    return {};
  }

  const specs: ProductSpecs = {};

  for (const [key, rawValue] of Object.entries(value)) {
    if (
      typeof rawValue === "string" ||
      typeof rawValue === "number" ||
      typeof rawValue === "boolean"
    ) {
      specs[key] = rawValue;
    }
  }

  return specs;
}

// ======================================================
// Positive Integer
// ======================================================

function normalizePositiveInteger(
  value: number
): number | null {
  if (
    !Number.isFinite(value) ||
    value <= 0
  ) {
    return null;
  }

  return Math.floor(value);
}