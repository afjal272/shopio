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

  camera: number;

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
  // ====================================================
  // Normalize Intent
  // ====================================================

  const weightedIntent =
    normalizeIntent(intent);

  // ====================================================
  // Build Context
  // ====================================================

  const ctx: ScoreContext = {
    ram: normalize(
      product.specs.ram ?? 0,
      16
    ),

    cpu: normalize(
      product.specs.processorScore ?? 0,
      10
    ),

    battery: normalize(
      product.specs.battery ?? 0,
      6000
    ),

    rating: normalize(
      product.rating ?? 0,
      5
    ),

    camera: normalize(
      product.specs.cameraMp ?? 0,
      200
    ),

    reviews:
      product.reviewsCount ?? 0,

    price:
      product.price,

    tags:
      (product.tags ?? [])
        .map((tag) =>
          tag.trim().toLowerCase()
        )
        .filter(Boolean),

    brand:
      product.brand
        .trim()
        .toLowerCase(),

    weightedIntent,
  };

  // ====================================================
  // Score Accumulator
  // ====================================================

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

  // ====================================================
  // Base Intent Score
  // ====================================================

  const weights =
    SCORE_WEIGHTS;

  for (
    const currentIntent
    of ctx.weightedIntent
  ) {
    const config =
      weights[currentIntent.type];

    if (!config) {
      continue;
    }

    const weightedScore =
      ctx.ram * config.ram +
      ctx.cpu * config.cpu +
      ctx.battery * config.batt +
      ctx.rating * config.rating;

    score.core +=
      weightedScore *
      currentIntent.weight;
  }

  // ====================================================
  // Intent-Specific Intelligence
  // ====================================================
  //
  // SCORE_WEIGHTS is intentionally kept backward
  // compatible. Product-specific signals such as
  // camera megapixels cannot be represented by the
  // existing ram/cpu/battery/rating matrix, so they
  // are applied here.
  //
  // ====================================================

  let intentAdjustment = 0;

  for (
    const currentIntent
    of ctx.weightedIntent
  ) {
    const weight =
      currentIntent.weight;

    switch (
      currentIntent.type
    ) {
      // ------------------------------------------------
      // Gaming
      // ------------------------------------------------

      case "gaming": {
        const gamingTag =
          hasAnyTag(
            ctx.tags,
            [
              "gaming",
              "gaming phone",
              "game",
              "performance",
              "performance phone",
              "high performance",
              "high-performance",
            ]
          );

        const gamingSignal =
          ctx.cpu * 0.55 +
          ctx.ram * 0.25 +
          ctx.battery * 0.20;

        intentAdjustment +=
          gamingSignal *
          weight *
          0.20;

        if (gamingTag) {
          intentAdjustment +=
            0.08 * weight;
        }

        break;
      }

      // ------------------------------------------------
      // Camera
      // ------------------------------------------------

      case "camera": {
        const cameraTag =
          hasAnyTag(
            ctx.tags,
            [
              "camera",
              "camera phone",
              "high-resolution-camera",
              "high resolution camera",
              "photography",
              "photography phone",
              "video",
              "video phone",
            ]
          );

        const cameraSignal =
          ctx.camera * 0.65 +
          ctx.rating * 0.20 +
          ctx.ram * 0.15;

        intentAdjustment +=
          cameraSignal *
          weight *
          0.25;

        if (cameraTag) {
          intentAdjustment +=
            0.08 * weight;
        }

        break;
      }

      // ------------------------------------------------
      // Battery
      // ------------------------------------------------

      case "battery": {
        const batteryTag =
          hasAnyTag(
            ctx.tags,
            [
              "battery",
              "large-battery",
              "large battery",
              "long-battery",
              "long battery",
              "long-lasting-battery",
              "long lasting battery",
              "battery backup",
              "long battery life",
            ]
          );

        const batterySignal =
          ctx.battery * 0.80 +
          ctx.rating * 0.20;

        intentAdjustment +=
          batterySignal *
          weight *
          0.25;

        if (batteryTag) {
          intentAdjustment +=
            0.08 * weight;
        }

        break;
      }

      // ------------------------------------------------
      // Balanced
      // ------------------------------------------------

      case "balanced": {
        const balancedSignal =
          ctx.ram * 0.25 +
          ctx.cpu * 0.25 +
          ctx.battery * 0.20 +
          ctx.rating * 0.30;

        intentAdjustment +=
          balancedSignal *
          weight *
          0.05;

        break;
      }
    }
  }

  score.adjustment +=
    intentAdjustment;

  // ====================================================
  // Breakdown
  // ====================================================

  score.breakdown.ram =
    Math.round(
      ctx.ram * 100
    );

  score.breakdown.processor =
    Math.round(
      ctx.cpu * 100
    );

  score.breakdown.battery =
    Math.round(
      ctx.battery * 100
    );

  score.breakdown.rating =
    Math.round(
      ctx.rating * 100
    );

  // ====================================================
  // Brand Score
  // ====================================================

  const brandBoost =
    BRAND_BOOST[ctx.brand] ?? 0;

  score.adjustment +=
    brandBoost;

  score.breakdown.brand =
    Math.round(
      brandBoost * 100
    );

  // ====================================================
  // Tag Score
  // ====================================================

  let tagBoost = 0;

  for (
    const currentIntent
    of ctx.weightedIntent
  ) {
    const weight =
      currentIntent.weight;

    if (
      currentIntent.type ===
        "gaming" &&
      hasAnyTag(
        ctx.tags,
        [
          "gaming",
          "gaming phone",
          "game",
          "performance",
          "performance phone",
          "high performance",
          "high-performance",
        ]
      )
    ) {
      tagBoost +=
        0.08 * weight;
    }

    if (
      currentIntent.type ===
        "camera" &&
      hasAnyTag(
        ctx.tags,
        [
          "camera",
          "camera phone",
          "high-resolution-camera",
          "high resolution camera",
          "photography",
          "photography phone",
          "video",
          "video phone",
        ]
      )
    ) {
      tagBoost +=
        0.08 * weight;
    }

    if (
      currentIntent.type ===
        "battery" &&
      hasAnyTag(
        ctx.tags,
        [
          "battery",
          "large-battery",
          "large battery",
          "long-battery",
          "long battery",
          "long-lasting-battery",
          "long lasting battery",
          "battery backup",
          "long battery life",
        ]
      )
    ) {
      tagBoost +=
        0.08 * weight;
    }
  }

  score.adjustment +=
    tagBoost;

  score.breakdown.tags =
    Math.round(
      tagBoost * 100
    );

  // ====================================================
  // Trust Score
  // ====================================================

  const trust =
    calculateTrustScore(
      ctx.reviews
    );

  const trustBoost =
    trust * 0.12;

  score.adjustment +=
    trustBoost;

  score.breakdown.trust =
    Math.round(
      trustBoost * 100
    );

  // ====================================================
  // Value Score
  // ====================================================

  const value =
    calculateValueScore(
      product.specs
        .processorScore ?? 0,

      product.specs.ram ?? 0,

      ctx.price
    );

  const valueBoost =
    Math.min(
      value * 4,
      0.08
    );

  score.adjustment +=
    valueBoost;

  score.breakdown.value =
    Math.round(
      valueBoost * 100
    );

  // ====================================================
  // Price Fit
  // ====================================================

  if (
    budget !== null &&
    budget > 0
  ) {
    const utilization =
      ctx.price / budget;

    let priceBoost = 0;

    if (
      utilization > 1.20
    ) {
      priceBoost -=
        0.22;
    } else if (
      utilization > 1.05
    ) {
      priceBoost -=
        0.15;
    } else if (
      utilization > 1
    ) {
      priceBoost -=
        0.08;
    } else if (
      utilization >= 0.90
    ) {
      priceBoost +=
        0.09;
    } else if (
      utilization >= 0.75
    ) {
      priceBoost +=
        0.07;
    } else if (
      utilization >= 0.60
    ) {
      priceBoost +=
        0.05;
    } else {
      priceBoost +=
        0.02;
    }

    score.adjustment +=
      priceBoost;

    score.breakdown.priceFit =
      Math.round(
        priceBoost * 100
      );
  }

  // ====================================================
  // Constraint Score
  // ====================================================

  if (constraints) {
    let constraintAdjustment =
      0;

    // --------------------------------------------------
    // RAM
    // --------------------------------------------------

    if (
      constraints.minRam != null
    ) {
      if (
        (product.specs.ram ?? 0) >=
        constraints.minRam
      ) {
        constraintAdjustment +=
          0.06;
      } else {
        constraintAdjustment -=
          0.12;
      }
    }

    // --------------------------------------------------
    // Battery
    // --------------------------------------------------

    if (
      constraints.minBattery != null
    ) {
      if (
        (product.specs.battery ?? 0) >=
        constraints.minBattery
      ) {
        constraintAdjustment +=
          0.05;
      } else {
        constraintAdjustment -=
          0.10;
      }
    }

    // --------------------------------------------------
    // Rating
    // --------------------------------------------------

    if (
      constraints.minRating != null
    ) {
      if (
        product.rating >=
        constraints.minRating
      ) {
        constraintAdjustment +=
          0.04;
      } else {
        constraintAdjustment -=
          0.08;
      }
    }

    score.adjustment +=
      constraintAdjustment;

    score.breakdown.constraints =
      Math.round(
        constraintAdjustment * 100
      );
  }

  // ====================================================
  // Tie Breaker
  // ====================================================

  let tieBreaker = 0;

  tieBreaker +=
    Math.log10(
      Math.max(
        ctx.reviews,
        1
      )
    ) * 0.02;

  tieBreaker +=
    product.rating * 0.01;

  tieBreaker +=
    (
      product.specs
        .processorScore ?? 0
    ) * 0.002;

  score.adjustment +=
    tieBreaker;

  score.breakdown.tieBreaker =
    Math.round(
      tieBreaker * 100
    );

  // ====================================================
  // Clamp Adjustment
  // ====================================================

  score.adjustment =
    Math.max(
      -0.25,
      Math.min(
        0.25,
        score.adjustment
      )
    );

  // ====================================================
  // Final Score
  // ====================================================

  const finalScore =
    Math.max(
      0,
      Math.min(
        1,
        score.core * 0.8 +
          score.adjustment
      )
    );

  const total =
    Math.round(
      Math.pow(
        finalScore,
        1.4
      ) * 100
    );

  // ====================================================
  // Final Breakdown
  // ====================================================

  score.breakdown.total =
    total;

  // ====================================================
  // Return
  // ====================================================

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

// ======================================================
// Intent Normalization
// ======================================================

function normalizeIntent(
  intent:
    | IntentType[]
    | WeightedIntent[]
): WeightedIntent[] {

  if (
    !Array.isArray(intent) ||
    intent.length === 0
  ) {
    return [
      {
        type: "balanced",
        weight: 1,
      },
    ];
  }

  // ----------------------------------------------------
  // IntentType[]
  // ----------------------------------------------------

  if (
    typeof intent[0] ===
    "string"
  ) {
    const types =
      intent as IntentType[];

    const weight =
      1 / types.length;

    return types.map(
      (type) => ({
        type,
        weight,
      })
    );
  }

  // ----------------------------------------------------
  // WeightedIntent[]
  // ----------------------------------------------------

  const weighted =
    (
      intent as WeightedIntent[]
    ).filter(
      (item) =>
        item &&
        typeof item.type ===
          "string" &&
        Number.isFinite(
          item.weight
        ) &&
        item.weight > 0
    );

  if (
    weighted.length === 0
  ) {
    return [
      {
        type: "balanced",
        weight: 1,
      },
    ];
  }

  // ----------------------------------------------------
  // Normalize Total Weight
  // ----------------------------------------------------

  const totalWeight =
    weighted.reduce(
      (sum, item) =>
        sum + item.weight,
      0
    );

  if (
    totalWeight <= 0
  ) {
    return [
      {
        type: "balanced",
        weight: 1,
      },
    ];
  }

  return weighted.map(
    (item) => ({
      type: item.type,

      weight:
        item.weight /
        totalWeight,
    })
  );
}

// ======================================================
// Tag Helper
// ======================================================

function hasAnyTag(
  tags: string[],
  candidates: string[]
): boolean {

  return candidates.some(
    (candidate) =>
      tags.includes(
        candidate
          .trim()
          .toLowerCase()
      )
  );
}