// ======================================================
// TEMPORARY V2.5 SCORING ENGINE
// This file will be modularized in Engine V3.
// ======================================================

import {
  Constraints,
  IntentType,
  Product,
  WeightedIntent,
} from "../types";

import {
  normalize,
  calculateTrustScore,
  calculateValueScore,
} from "./helpers";

import {
  SCORE_WEIGHTS,
  BRAND_BOOST,
} from "./weights";

// ======================================================
// Types
// ======================================================

interface ScoreContext {
  ram: number;

  cpu: number;

  battery: number;

  rating: number;

  reviews: number;

  price: number;

  tags: string[];

  brand: string;

  weightedIntent: WeightedIntent[];
}

interface ScoreAccumulator {
  core: number;

  adjustment: number;

  breakdown: {
    ram: number;
    processor: number;
    battery: number;
    rating: number;

    brand: number;
    tags: number;
    trust: number;
    value: number;
    priceFit: number;
    constraints: number;
    tieBreaker: number;

    total: number;
  };
}

// ======================================================
// Main
// ======================================================

export function scoreProduct(
  product: Product,
  intent: IntentType[] | WeightedIntent[],
  budget: number | null,
  constraints?: Constraints
) {

  // ======================================================
  // Normalize Intent
  // ======================================================

  let weightedIntent: WeightedIntent[] = [];

if (Array.isArray(intent) && intent.length > 0) {
  if (typeof intent[0] === "string") {
    const weight = 1 / intent.length;

    weightedIntent = (intent as IntentType[]).map((type) => ({
      type,
      weight,
    }));
  } else {
    weightedIntent = intent as WeightedIntent[];
  }
} else {
  weightedIntent = [
    {
      type: "balanced",
      weight: 1,
    },
  ];
}

  // ======================================================
  // Build Context
  // ======================================================

  const ctx: ScoreContext = {

    ram: normalize(product.specs.ram ?? 0, 16),

    cpu: normalize(product.specs.processorScore ?? 0, 10),

    battery: normalize(product.specs.battery ?? 0, 6000),

    rating: normalize(product.rating ?? 0, 5),

    reviews: product.reviewsCount ?? 0,

    price: product.price,

    tags: product.tags ?? [],

    brand: product.brand.toLowerCase(),

    weightedIntent,

  };

  // ======================================================
  // Score Accumulator
  // ======================================================

  const score: ScoreAccumulator = {

    core: 0,

    adjustment: 0,

    breakdown: {

      ram: 0,

      processor: 0,

      battery: 0,

      rating: 0,

      brand: 0,

      tags: 0,

      trust: 0,

      value: 0,

      priceFit: 0,

      constraints: 0,

      tieBreaker: 0,

      total: 0,

    },

  };

  // ======================================================
  // PART 2 Starts Here
  // Core Score Calculation
  // ======================================================

    // ======================================================
  // Core Score
  // ======================================================

  const weights = SCORE_WEIGHTS;

  for (const currentIntent of ctx.weightedIntent) {

    const config = weights[currentIntent.type];

    const weightedScore =
      ctx.ram * config.ram +
      ctx.cpu * config.cpu +
      ctx.battery * config.batt +
      ctx.rating * config.rating;

    score.core +=
      weightedScore * currentIntent.weight;

  }

  score.breakdown.ram =
    Math.round(ctx.ram * 100);

  score.breakdown.processor =
    Math.round(ctx.cpu * 100);

  score.breakdown.battery =
    Math.round(ctx.battery * 100);

  score.breakdown.rating =
    Math.round(ctx.rating * 100);

  // ======================================================
  // Brand Score
  // ======================================================

  const brandBoost =
    BRAND_BOOST[ctx.brand] ?? 0;

  score.adjustment += brandBoost;

  score.breakdown.brand =
    Math.round(brandBoost * 100);

  // ======================================================
  // Tag Score
  // ======================================================

  let tagBoost = 0;

  const intents =
    ctx.weightedIntent.map(
      (item) => item.type
    );

  if (
    intents.includes("gaming") &&
    ctx.tags.includes("gaming")
  ) {
    tagBoost += 0.08;
  }

  if (
    intents.includes("camera") &&
    ctx.tags.includes("camera")
  ) {
    tagBoost += 0.08;
  }

  if (
    intents.includes("battery") &&
    ctx.tags.includes("battery")
  ) {
    tagBoost += 0.08;
  }

  score.adjustment += tagBoost;

  score.breakdown.tags =
    Math.round(tagBoost * 100);

  // ======================================================
  // Part 3 Starts Here
  // ======================================================

    // ======================================================
  // Trust Score
  // ======================================================

  const trust =
    calculateTrustScore(ctx.reviews);

  const trustBoost = trust * 0.12;

  score.adjustment += trustBoost;

  score.breakdown.trust =
    Math.round(trustBoost * 100);

  // ======================================================
  // Value Score
  // ======================================================

  const value =
    calculateValueScore(
      product.specs.processorScore ?? 0,
      product.specs.ram ?? 0,
      ctx.price
    );

  const valueBoost =
    Math.min(value * 4, 0.08);

  score.adjustment += valueBoost;

  score.breakdown.value =
    Math.round(valueBoost * 100);

  // ======================================================
  // Price Fit
  // ======================================================

  if (
    budget !== null &&
    budget > 0
  ) {

    const utilization =
      ctx.price / budget;

    let priceBoost = 0;

    if (utilization > 1.20) {

      priceBoost -= 0.22;

    } else if (utilization > 1.05) {

      priceBoost -= 0.15;

    } else if (utilization > 1) {

      priceBoost -= 0.08;

    } else if (utilization >= 0.90) {

      priceBoost += 0.09;

    } else if (utilization >= 0.75) {

      priceBoost += 0.07;

    } else if (utilization >= 0.60) {

      priceBoost += 0.05;

    } else {

      priceBoost += 0.02;

    }

    score.adjustment += priceBoost;

    score.breakdown.priceFit =
      Math.round(priceBoost * 100);

  }

  // ======================================================
  // Constraint Score
  // ======================================================

  if (constraints) {

    let constraintAdjustment = 0;

    if (
      constraints.minRam != null
    ) {

      if (
        (product.specs.ram ?? 0) >=
        constraints.minRam
      ) {

        constraintAdjustment += 0.06;

      } else {

        constraintAdjustment -= 0.12;

      }

    }

    if (
      constraints.minBattery != null
    ) {

      if (
        (product.specs.battery ?? 0) >=
        constraints.minBattery
      ) {

        constraintAdjustment += 0.05;

      } else {

        constraintAdjustment -= 0.10;

      }

    }

    if (
      constraints.minRating != null
    ) {

      if (
        product.rating >=
        constraints.minRating
      ) {

        constraintAdjustment += 0.04;

      } else {

        constraintAdjustment -= 0.08;

      }

    }

    score.adjustment +=
      constraintAdjustment;

    score.breakdown.constraints =
      Math.round(
        constraintAdjustment * 100
      );

  }

  // ======================================================
  // Tie Breaker
  // ======================================================

  let tieBreaker = 0;

  tieBreaker +=
    Math.log10(
      Math.max(ctx.reviews, 1)
    ) * 0.02;

  tieBreaker +=
    product.rating * 0.01;

  tieBreaker +=
    (product.specs.processorScore ?? 0) *
    0.002;

  score.adjustment += tieBreaker;

  score.breakdown.tieBreaker =
    Math.round(
      tieBreaker * 100
    );

  // ======================================================
  // Clamp Adjustment
  // ======================================================

  score.adjustment = Math.max(
    -0.25,
    Math.min(
      0.25,
      score.adjustment
    )
  );

  // ======================================================
  // Part 4 Starts Here
  // ======================================================


    // ======================================================
  // Final Score
  // ======================================================

  const finalScore = Math.max(
    0,
    Math.min(
      1,
      score.core * 0.8 +
        score.adjustment
    )
  );

  const total = Math.round(
    Math.pow(finalScore, 1.4) * 100
  );

  // ======================================================
  // Final Breakdown
  // ======================================================

  score.breakdown.total = total;

  // ======================================================
  // Return
  // ======================================================

  return {

    total,

    breakdown: {

      ram:
        score.breakdown.ram,

      processor:
        score.breakdown.processor,

      battery:
        score.breakdown.battery,

      rating:
        score.breakdown.rating,

      brand:
        score.breakdown.brand,

      tags:
        score.breakdown.tags,

      trust:
        score.breakdown.trust,

      value:
        score.breakdown.value,

      priceFit:
        score.breakdown.priceFit,

      constraints:
        score.breakdown.constraints,

      tieBreaker:
        score.breakdown.tieBreaker,

      total:
        score.breakdown.total,

    },

  };

}