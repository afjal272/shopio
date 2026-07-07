import {
  IntentType,
  Product,
  WeightedIntent,
} from "../types";

import {
  ScoreCard,
  ScoredProduct,
} from "./comparison.types";

import { COMPARISON_WEIGHTS } from "./weights";

import {
  normalizeBattery,
  normalizeCamera,
  normalizeCPU,
  normalizeRAM,
  normalizeValue,
} from "./normalizers";

export function calculateScores(
  products: Product[],
  intent: IntentType[] | WeightedIntent[] = ["balanced"]
): ScoredProduct[] {

  // =====================================================
  // Resolve Primary Intent
  // =====================================================

  const primaryIntent =
    intent.length === 0
      ? "balanced"
      : typeof intent[0] === "string"
        ? intent[0]
        : intent[0].type;

  const weights =
    COMPARISON_WEIGHTS[primaryIntent];

  // =====================================================
  // Score Products
  // =====================================================

  return products.map((product) => {

    const specs = product.specs ?? {};

    const cpu =
      normalizeCPU(
        specs.processorScore ?? 0
      );

    const ram =
      normalizeRAM(
        specs.ram ?? 0
      );

    const battery =
      normalizeBattery(
        specs.battery ?? 0,
        cpu
      );

    const camera =
      normalizeCamera(
        product.rating ?? 0,
        product.reviewsCount ?? 0
      );

    // =====================================================
    // Base Performance
    // =====================================================

    const basePerformance =
      cpu * 3 +
      ram * 2 +
      battery * 2 +
      camera * 2;

    // =====================================================
    // Value Score
    // =====================================================

    const value =
      normalizeValue(
        basePerformance,
        product.price
      );

    // =====================================================
    // Trust Score
    // =====================================================

    let trust = 0;

    const reviews =
      product.reviewsCount ?? 0;

    if (reviews >= 10000) trust = 100;
    else if (reviews >= 5000) trust = 95;
    else if (reviews >= 2000) trust = 90;
    else if (reviews >= 1000) trust = 85;
    else if (reviews >= 500) trust = 75;
    else if (reviews >= 100) trust = 60;
    else trust = 40;

    // =====================================================
    // Price Fit
    // =====================================================

    const priceFit =
      value > 80
        ? 100
        : value > 60
        ? 80
        : value > 40
        ? 60
        : 40;

    // =====================================================
    // Score Card
    // =====================================================

    const scoreCard: ScoreCard = {

      cpu,

      ram,

      battery,

      camera,

      value,

      trust,

      priceFit,

      total:

        cpu * weights.cpu +

        ram * weights.ram +

        battery * weights.battery +

        camera * weights.camera +

        value * weights.value,

    };

    return {

      ...product,

      score:
        Number(
          scoreCard.total.toFixed(2)
        ),

      scoreCard,

    };

  });

}