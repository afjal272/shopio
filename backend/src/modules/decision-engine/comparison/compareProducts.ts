import {
  IntentType,
  Product,
  WeightedIntent,
} from "../types";

import {
  CategoryWinner,
  ComparisonResult,
  ProductStrength,
} from "./comparison.types";

import { calculateScores } from "./calculateScores";
import { calculateWinner } from "./calculateWinner";
import { calculateWeaknesses } from "./calculateWeaknesses";

import { COMPARISON } from "../engine/engine.constants";

// ======================================================
// Build Comparison Reasons
// ======================================================

function buildReasons(
  winner: Product,
  runnerUp: Product,
  intent: IntentType[] | WeightedIntent[]
): string[] {

  const reasons: string[] = [];

  const winnerSpecs = winner.specs ?? {};
  const runnerSpecs = runnerUp.specs ?? {};

  const intentTypes = intent.map((item) =>
    typeof item === "string"
      ? item
      : item.type
  );

  // =====================================================
  // Gaming
  // =====================================================

  if (intentTypes.includes("gaming")) {

    if (
      (winnerSpecs.processorScore ?? 0) >
      (runnerSpecs.processorScore ?? 0)
    ) {
      reasons.push(
        `${winner.name} delivers better gaming performance`
      );
    }

    if (
      (winnerSpecs.ram ?? 0) >
      (runnerSpecs.ram ?? 0)
    ) {
      reasons.push(
        `${winner.name} offers smoother multitasking`
      );
    }

  }

  // =====================================================
  // Battery
  // =====================================================

  if (intentTypes.includes("battery")) {

    if (
      (winnerSpecs.battery ?? 0) >
      (runnerSpecs.battery ?? 0)
    ) {
      reasons.push(
        `${winner.name} provides longer battery life`
      );
    }

  }

  // =====================================================
  // Camera
  // =====================================================

  if (intentTypes.includes("camera")) {

    if (
      (winner.rating ?? 0) >
      (runnerUp.rating ?? 0)
    ) {
      reasons.push(
        `${winner.name} delivers a better camera experience`
      );
    }

  }

  // =====================================================
  // Value
  // =====================================================

  if (
    winner.price <= runnerUp.price &&
    (winner.score ?? 0) >= (runnerUp.score ?? 0)
  ) {
    reasons.push(
      `${winner.name} offers better value for money`
    );
  }

  // =====================================================
  // Trust
  // =====================================================

  if (
    (winner.reviewsCount ?? 0) >
    (runnerUp.reviewsCount ?? 0)
  ) {
    reasons.push(
      `${winner.name} is trusted by more users`
    );
  }

  // =====================================================
  // Overall
  // =====================================================

  if (
    (winner.score ?? 0) >
    (runnerUp.score ?? 0)
  ) {
    reasons.push(
      `${winner.name} delivers stronger overall performance`
    );
  }

  return Array.from(
    new Set(reasons)
  ).slice(0, COMPARISON.MAX_REASONS);

}

// ======================================================
// Strength Builder
// ======================================================

function buildStrengths(
  winner: Product
): ProductStrength[] {

  return [

    {
      id: winner.id,

      points: winner.highlights ?? [],
    },

  ];

}

// ======================================================
// Category Winners
// ======================================================

function buildCategoryWinner(
  winner: Product
): CategoryWinner {

  return {

    gaming: winner.id,

    battery: winner.id,

    camera: winner.id,

    value: winner.id,

    trust: winner.id,

  };

}

// ======================================================
// Compare Products
// ======================================================

export function compareProducts(
  products: Product[],
  intent: IntentType[] | WeightedIntent[] = ["balanced"]
): ComparisonResult {

  if (!products || products.length < 2) {

    return {

      winner: null,

      reasons: [],

      scores: [],

      weaknesses: [],

      strengths: [],

      categoryWinners: {},

      confidence: 0,

      intent,

    };

  }

  // =====================================================
  // Score Products
  // =====================================================

  const scoredProducts =
    calculateScores(products, intent);

  // =====================================================
  // Winner
  // =====================================================

  const comparison =
    calculateWinner(scoredProducts);

  if (!comparison) {

    return {

      winner: null,

      reasons: [],

      scores: [],

      weaknesses: [],

      strengths: [],

      categoryWinners: {},

      confidence: 0,

      intent,

    };

  }

  // =====================================================
  // Build
  // =====================================================

  const reasons =
    buildReasons(
      comparison.winner,
      comparison.runnerUp,
      intent
    );

  const weaknesses =
    calculateWeaknesses(
      comparison.rankedProducts
    );

  const strengths =
    buildStrengths(
      comparison.winner
    );

  const categoryWinners =
    buildCategoryWinner(
      comparison.winner
    );

  const confidence =
    Math.min(
      100,
      Math.round(
        comparison.winner.confidence ?? 90
      )
    );

  // =====================================================
  // Result
  // =====================================================

  return {

    winner:
      comparison.winner.id,

    reasons,

    scores:
      comparison.rankedProducts.map(
        (product) => ({

          id: product.id,

          score: product.score,

          confidence:
            product.confidence,

        })
      ),

    weaknesses,

    strengths,

    categoryWinners,

    confidence,

    intent,

  };

}