import { Product } from "../types";

import {
  CONFIDENCE,
  PRODUCT,
  SCORE,
} from "./engine.constants";

export function optimizeProduct<
  T extends Product
>(
  product: T
): T {
  return {
    ...product,

    name: normalizeName(product),

    images: normalizeImages(product),

    price: normalizePrice(product),

    rating: normalizeRating(product),

    specs: product.specs ?? {},

    tags: product.tags ?? PRODUCT.DEFAULT_TAGS,

    highlights:
      product.highlights ??
      PRODUCT.DEFAULT_HIGHLIGHTS,

    weaknesses:
      product.weaknesses ??
      PRODUCT.DEFAULT_WEAKNESSES,

    score: normalizeScore(product.score),

    confidence: normalizeConfidence(
      product.confidence
    ),
  };
}

// =====================================================
// Name
// =====================================================

function normalizeName(
  product: Product
): string {
  return (
    product.name?.trim() ??
    PRODUCT.DEFAULT_NAME
  );
}

// =====================================================
// Images
// =====================================================

function normalizeImages(
  product: Product
): string[] {
  return (
    product.images ??
    PRODUCT.DEFAULT_IMAGES
  );
}

// =====================================================
// Price
// =====================================================

function normalizePrice(
  product: Product
): number {
  return Math.max(
    PRODUCT.DEFAULT_PRICE,
    product.price
  );
}

// =====================================================
// Rating
// =====================================================

function normalizeRating(
  product: Product
): number {
  return Math.min(
    5,
    Math.max(
      PRODUCT.DEFAULT_RATING,
      product.rating
    )
  );
}

// =====================================================
// Score
// =====================================================

function normalizeScore(
  score?: number
): number {
  if (score == null) {
    return SCORE.MIN;
  }

  return Math.min(
    SCORE.MAX,
    Math.max(SCORE.MIN, score)
  );
}

// =====================================================
// Confidence
// =====================================================

function normalizeConfidence(
  confidence?: number
): number {
  if (confidence == null) {
    return CONFIDENCE.DEFAULT;
  }

  return Math.min(
    CONFIDENCE.MAX,
    Math.max(
      CONFIDENCE.MIN,
      Math.round(confidence)
    )
  );
}