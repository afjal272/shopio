import {
  Constraints,
  IntentType,
  Product,
  WeightedIntent,
} from "../types";

import { EXPLANATION } from "../engine/engine.constants";

export function generateExplanation(
  product: Product,
  intent: IntentType[] | WeightedIntent[],
  constraints?: Constraints
): string {

  const specs = product.specs ?? {};

  const ram = specs.ram ?? 0;
  const battery = specs.battery ?? 0;
  const processor = specs.processorScore ?? 0;

  const rating = product.rating ?? 0;
  const reviews = product.reviewsCount ?? 0;

  const tags = product.tags ?? [];

  const intentNames = intent.map((item) =>
    typeof item === "string"
      ? item
      : item.type
  );

  const reasons: string[] = [];

  // =====================================================
  // CONSTRAINT-AWARE REASONS
  // =====================================================

  if (
    constraints?.minRam !== undefined &&
    constraints.minRam !== null
  ) {
    if (ram >= constraints.minRam) {
      reasons.push(
        `${ram}GB RAM meets your requirement`
      );
    } else {
      reasons.push(
        `RAM is below your preferred ${constraints.minRam}GB`
      );
    }
  }

  if (
    constraints?.minBattery !== undefined &&
    constraints.minBattery !== null
  ) {
    if (battery >= constraints.minBattery) {
      reasons.push(
        `${battery}mAh battery meets your requirement`
      );
    } else {
      reasons.push(
        `Battery is lower than expected ${constraints.minBattery}mAh`
      );
    }
  }

  if (
    constraints?.minRating !== undefined &&
    constraints.minRating !== null
  ) {
    if (rating >= constraints.minRating) {
      reasons.push(
        `Rating (${rating}⭐) meets your expectation`
      );
    } else {
      reasons.push(
        `Rating (${rating}⭐) is below preferred level`
      );
    }
  }

  // =====================================================
  // GAMING
  // =====================================================

  if (intentNames.includes("gaming")) {

    if (processor >= 8) {
      reasons.push(
        `Strong processor (${processor}/10) ensures smooth gaming`
      );
    } else if (processor >= 6) {
      reasons.push(
        `Decent processor (${processor}/10) handles moderate gaming`
      );
    } else {
      reasons.push(
        `Limited processor performance for heavy gaming`
      );
    }

    if (ram >= 8) {
      reasons.push(
        `${ram}GB RAM supports multitasking and gaming`
      );
    }

  }

  // =====================================================
  // CAMERA
  // =====================================================

  if (intentNames.includes("camera")) {

    if (rating >= 4.3) {
      reasons.push(
        `High user rating (${rating}⭐) indicates good camera performance`
      );
    } else {
      reasons.push(
        `Average rating (${rating}⭐) suggests camera is decent`
      );
    }

    if (tags.includes("camera")) {
      reasons.push(
        "Optimized for photography"
      );
    }

  }

  // =====================================================
  // BATTERY
  // =====================================================

  if (intentNames.includes("battery")) {

    if (battery >= 6000) {
      reasons.push(
        `${battery}mAh battery easily lasts more than a day`
      );
    } else if (battery >= 5000) {
      reasons.push(
        `${battery}mAh battery is reliable for daily usage`
      );
    } else {
      reasons.push(
        "Battery life may be average"
      );
    }

  }

  // =====================================================
  // BALANCED
  // =====================================================

  if (
    intentNames.includes("balanced") &&
    reasons.length === 0
  ) {

    reasons.push(
      `${ram}GB RAM and stable performance for everyday use`
    );

    reasons.push(
      `${battery}mAh battery for regular usage`
    );

  }

  // =====================================================
  // TRUST SIGNAL
  // =====================================================

  if (reviews > 1000) {

    reasons.push(
      `${reviews}+ reviews indicate strong market trust`
    );

  } else if (reviews > 100) {

    reasons.push(
      `${reviews}+ reviews provide reasonable confidence`
    );

  }

  // =====================================================
  // SAFETY FALLBACK
  // =====================================================

  if (reasons.length === 0) {

    reasons.push(
      "Balanced specifications for general usage"
    );

  }

  // =====================================================
  // LIMIT REASONS
  // =====================================================

  const finalReasons = reasons.slice(
    0,
    EXPLANATION.MAX_REASONS
  );

  // =====================================================
  // PRODUCT NAME
  // =====================================================

  const productName = product.name;

  // =====================================================
  // INTENT TEXT
  // =====================================================

  const intentText =
    intentNames.length > 1
      ? intentNames.join(" & ")
      : intentNames[0] ?? "general use";

  // =====================================================
  // FINAL EXPLANATION
  // =====================================================

  return `${productName} is a good fit for ${intentText} because it offers ${finalReasons.join(", ")}.`;

}