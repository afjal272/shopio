import {
  CONFIDENCE,
  SCORE,
} from "../engine/engine.constants";

export function calculateConfidence(
  score: number,
  rating: number,
  reviews: number
): number {

  let confidence = 0;

  // =====================================================
  // Ranking Score (60%)
  // =====================================================

  confidence +=
    normalizeScore(score) * 0.6;

  // =====================================================
  // User Rating (25%)
  // =====================================================

  confidence +=
    normalizeRating(rating) * 0.25;

  // =====================================================
  // Review Trust (15%)
  // =====================================================

  confidence +=
    reviewConfidence(reviews) * 0.15;

  return Math.max(
    CONFIDENCE.MIN,
    Math.min(
      CONFIDENCE.MAX,
      Math.round(confidence)
    )
  );

}

// =====================================================
// Helpers
// =====================================================

function normalizeScore(
  score: number
): number {

  return Math.max(
    SCORE.MIN,
    Math.min(SCORE.MAX, score)
  );

}

function normalizeRating(
  rating: number
): number {

  return Math.max(
    0,
    Math.min(100, (rating / 5) * 100)
  );

}

function reviewConfidence(
  reviews: number
): number {

  if (reviews >= 10000) return 100;

  if (reviews >= 5000) return 95;

  if (reviews >= 2000) return 90;

  if (reviews >= 1000) return 85;

  if (reviews >= 500) return 75;

  if (reviews >= 200) return 65;

  if (reviews >= 100) return 55;

  if (reviews >= 50) return 45;

  if (reviews >= 10) return 35;

  return 20;

}