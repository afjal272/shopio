import {
  Constraints,
  IntentType,
  Product,
  WeightedIntent,
} from "../types";

import { EXPLANATION } from "../engine/engine.constants";

export function getRejectionReason(
  product: Product,
  intent: IntentType[] | WeightedIntent[],
  budget: number | null,
  constraints?: Constraints
): string {

  const specs = product.specs ?? {};

  const ram = specs.ram ?? 0;
  const battery = specs.battery ?? 0;
  const processor = specs.processorScore ?? 0;

  const rating = product.rating ?? 0;
  const reviews = product.reviewsCount ?? 0;

  const intentNames = intent.map((item) =>
    typeof item === "string"
      ? item
      : item.type
  );

  const reasons: string[] = [];

  // =====================================================
  // CONSTRAINT FAIL REASONS
  // =====================================================

  if (
    constraints?.minRam !== undefined &&
    constraints.minRam !== null &&
    ram < constraints.minRam
  ) {
    reasons.push(
      `Does not meet ${constraints.minRam}GB RAM requirement`
    );
  }

  if (
    constraints?.minBattery !== undefined &&
    constraints.minBattery !== null &&
    battery < constraints.minBattery
  ) {
    reasons.push(
      `Battery below required ${constraints.minBattery}mAh`
    );
  }

  if (
    constraints?.minRating !== undefined &&
    constraints.minRating !== null &&
    rating < constraints.minRating
  ) {
    reasons.push(
      `Rating (${rating}⭐) is below the preferred level`
    );
  }

  // =====================================================
  // BUDGET
  // =====================================================

  if (
    budget !== null &&
    budget > 0 &&
    product.price > budget
  ) {
    reasons.push(
      `Over budget (₹${product.price})`
    );
  }

  // =====================================================
  // GAMING
  // =====================================================

  if (intentNames.includes("gaming")) {

    if (processor < 6) {
      reasons.push(
        `Weak processor (${processor}/10) for gaming`
      );
    }

    if (ram < 6) {
      reasons.push(
        `Low RAM (${ram}GB) limits gaming performance`
      );
    }

  }

  // =====================================================
  // BATTERY
  // =====================================================

  if (intentNames.includes("battery")) {

    if (battery < 5000) {
      reasons.push(
        `Battery (${battery}mAh) is below ideal`
      );
    }

  }

  // =====================================================
  // CAMERA
  // =====================================================

  if (intentNames.includes("camera")) {

    if (rating < 4.2) {
      reasons.push(
        `Average camera performance (${rating}⭐)`
      );
    }

  }

  // =====================================================
  // TRUST SIGNAL
  // =====================================================

  if (reviews < 200) {

    reasons.push(
      `Very low user trust (${reviews} reviews)`
    );

  } else if (reviews < 800) {

    reasons.push(
      "Less proven than top-rated alternatives"
    );

  }

  // =====================================================
  // GENERAL PERFORMANCE
  // =====================================================

  if (
    !intentNames.includes("gaming") &&
    processor < 5
  ) {
    reasons.push(
      "Overall performance is below average"
    );
  }

  // =====================================================
  // FALLBACK
  // =====================================================

  if (reasons.length === 0) {
    return "Weaker value compared to better-ranked alternatives";
  }

  // =====================================================
  // REMOVE DUPLICATES
  // =====================================================

  const uniqueReasons = Array.from(
    new Set(reasons)
  );

  // =====================================================
  // LIMIT REASONS
  // =====================================================

  return uniqueReasons
    .slice(0, EXPLANATION.MAX_HIGHLIGHTS)
    .join(", ");
}