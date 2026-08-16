import {
  Constraints,
  IntentType,
  Product,
  WeightedIntent,
} from "../types";

import { EXPLANATION } from "../engine/engine.constants";

// ======================================================
// Rejection Reason Builder
// ======================================================

export function getRejectionReason(
  product: Product,
  intent: IntentType[] | WeightedIntent[],
  budget: number | null,
  constraints?: Constraints
): string {
  const specs = product.specs ?? {};

  const ram = safeNumber(specs.ram);
  const battery = safeNumber(specs.battery);
  const rating = safeNumber(product.rating);
  const reviews = safeNumber(product.reviewsCount);

  const processor = resolveProcessorScore(
    specs.processorScore,
    specs.chipset
  );

  const cameraMp = safeNumber(
    specs.cameraMp
  );

  const intentNames =
    extractIntentNames(intent);

  const reasons: string[] = [];

  // ====================================================
  // HARD CONSTRAINTS
  // ====================================================

  addConstraintReasons(
    reasons,
    product,
    ram,
    battery,
    rating,
    budget,
    constraints
  );

  // ====================================================
  // GAMING
  // ====================================================

  if (
    intentNames.includes("gaming")
  ) {
    addGamingReasons(
      reasons,
      processor,
      ram
    );
  }

  // ====================================================
  // BATTERY
  // ====================================================

  if (
    intentNames.includes("battery")
  ) {
    addBatteryReasons(
      reasons,
      battery
    );
  }

  // ====================================================
  // CAMERA
  // ====================================================

  if (
    intentNames.includes("camera")
  ) {
    addCameraReasons(
      reasons,
      cameraMp,
      rating
    );
  }

  // ====================================================
  // TRUST
  // ====================================================

  addTrustReason(
    reasons,
    reviews
  );

  // ====================================================
  // GENERAL PERFORMANCE
  // ====================================================

  if (
    !intentNames.includes("gaming") &&
    processor > 0 &&
    processor < 4
  ) {
    reasons.push(
      `lower processor performance (${processor.toFixed(1)}/10)`
    );
  }

  // ====================================================
  // Remove Duplicates
  // ====================================================

  const uniqueReasons =
    Array.from(
      new Set(reasons)
    );

  // ====================================================
  // No Strong Rejection
  // ====================================================

  if (
    uniqueReasons.length === 0
  ) {
    return (
      "Weaker overall match compared with higher-ranked alternatives"
    );
  }

  // ====================================================
  // Final Reasons
  // ====================================================

  return uniqueReasons
    .slice(
      0,
      EXPLANATION.MAX_HIGHLIGHTS
    )
    .join(", ");
}

// ======================================================
// Constraint Reasons
// ======================================================

function addConstraintReasons(
  reasons: string[],
  product: Product,
  ram: number,
  battery: number,
  rating: number,
  budget: number | null,
  constraints?: Constraints
): void {
  // ----------------------------------------------------
  // RAM
  // ----------------------------------------------------

  if (
    constraints?.minRam != null &&
    ram > 0 &&
    ram < constraints.minRam
  ) {
    reasons.push(
      `${ram}GB RAM is below the required ${constraints.minRam}GB`
    );
  }

  // ----------------------------------------------------
  // Maximum RAM
  // ----------------------------------------------------

  if (
    constraints?.maxRam != null &&
    ram > constraints.maxRam
  ) {
    reasons.push(
      `${ram}GB RAM exceeds the preferred maximum of ${constraints.maxRam}GB`
    );
  }

  // ----------------------------------------------------
  // Battery
  // ----------------------------------------------------

  if (
    constraints?.minBattery != null &&
    battery > 0 &&
    battery < constraints.minBattery
  ) {
    reasons.push(
      `${battery}mAh battery is below the required ${constraints.minBattery}mAh`
    );
  }

  if (
    constraints?.maxBattery != null &&
    battery > constraints.maxBattery
  ) {
    reasons.push(
      `${battery}mAh battery exceeds the preferred maximum`
    );
  }

  // ----------------------------------------------------
  // Rating
  // ----------------------------------------------------

  if (
    constraints?.minRating != null &&
    rating > 0 &&
    rating < constraints.minRating
  ) {
    reasons.push(
      `rating ${rating.toFixed(1)}⭐ is below the required ${constraints.minRating}⭐`
    );
  }

  // ----------------------------------------------------
  // Explicit Maximum Price
  // ----------------------------------------------------

  if (
    constraints?.maxPrice != null &&
    product.price > constraints.maxPrice
  ) {
    reasons.push(
      `price of ₹${formatPrice(product.price)} exceeds your ₹${formatPrice(constraints.maxPrice)} limit`
    );
  }

  // ----------------------------------------------------
  // Query Budget
  // ----------------------------------------------------
  //
  // This is an actual budget violation.
  // Never call a product "overpriced" merely because
  // another product is cheaper.
  //

  if (
    budget != null &&
    budget > 0 &&
    product.price > budget
  ) {
    reasons.push(
      `price of ₹${formatPrice(product.price)} is above your ₹${formatPrice(budget)} budget`
    );
  }
}

// ======================================================
// Gaming Rejection
// ======================================================

function addGamingReasons(
  reasons: string[],
  processor: number,
  ram: number
): void {
  // ----------------------------------------------------
  // Only reject when the hardware is genuinely weak.
  // Missing data must not automatically mean failure.
  // ----------------------------------------------------

  if (
    processor > 0 &&
    processor < 4.5
  ) {
    reasons.push(
      `processor performance (${processor.toFixed(1)}/10) is weak for gaming`
    );
  }

  if (
    ram > 0 &&
    ram < 6
  ) {
    reasons.push(
      `${ram}GB RAM may limit heavier gaming`
    );
  }
}

// ======================================================
// Battery Rejection
// ======================================================

function addBatteryReasons(
  reasons: string[],
  battery: number
): void {
  if (
    battery > 0 &&
    battery < 4500
  ) {
    reasons.push(
      `${battery}mAh battery has relatively low capacity`
    );
  }
}

// ======================================================
// Camera Rejection
// ======================================================

function addCameraReasons(
  reasons: string[],
  cameraMp: number,
  rating: number
): void {
  // Camera MP is only used when actual camera data exists.
  if (
    cameraMp > 0 &&
    cameraMp < 32
  ) {
    reasons.push(
      `${cameraMp}MP main camera has modest resolution`
    );
  }

  // Rating is a general product signal.
  // Do NOT call it "camera performance".
  if (
    rating > 0 &&
    rating < 3.8
  ) {
    reasons.push(
      `overall user rating is ${rating.toFixed(1)}⭐`
    );
  }
}

// ======================================================
// Trust Reason
// ======================================================

function addTrustReason(
  reasons: string[],
  reviews: number
): void {
  // Do not reject a product just because it has
  // fewer reviews. This is a confidence signal,
  // not a product-quality failure.
  if (
    reviews > 0 &&
    reviews < 100
  ) {
    reasons.push(
      `limited review history (${formatNumber(reviews)} reviews)`
    );
  }
}

// ======================================================
// Intent Extraction
// ======================================================

function extractIntentNames(
  intent:
    | IntentType[]
    | WeightedIntent[]
): IntentType[] {
  if (
    !Array.isArray(intent) ||
    intent.length === 0
  ) {
    return ["balanced"];
  }

  const names =
    intent
      .map(
        (item) =>
          typeof item === "string"
            ? item
            : item.type
      )
      .filter(
        isIntentType
      );

  return Array.from(
    new Set(names)
  );
}

// ======================================================
// Processor Score
// ======================================================

function resolveProcessorScore(
  processorScore: unknown,
  chipset: unknown
): number {
  if (
    typeof processorScore === "number" &&
    Number.isFinite(processorScore) &&
    processorScore > 0
  ) {
    return clamp(
      processorScore,
      0,
      10
    );
  }

  if (
    typeof chipset !== "string" ||
    !chipset.trim()
  ) {
    return 0;
  }

  return getProcessorScore(
    chipset
  );
}

// ======================================================
// Processor Intelligence
// ======================================================

function getProcessorScore(
  chipset: string
): number {
  const normalized =
    chipset
      .trim()
      .toLowerCase()
      .replace(
        /\s+/g,
        " "
      );

  // ----------------------------------------------------
  // Apple
  // ----------------------------------------------------

  const apple =
    normalized.match(
      /\ba(\d+)\b/
    );

  if (apple?.[1]) {
    const generation =
      Number(apple[1]);

    if (generation >= 19) return 10;
    if (generation === 18) return 9.8;
    if (generation === 17) return 9.5;
    if (generation === 16) return 9.2;
    if (generation === 15) return 8.8;
    if (generation === 14) return 8.4;
    if (generation === 13) return 8;
    if (generation === 12) return 7.6;
    if (generation === 11) return 7.2;
    if (generation === 10) return 6.8;
  }

  // ----------------------------------------------------
  // Snapdragon
  // ----------------------------------------------------

  if (
    normalized.includes(
      "snapdragon"
    )
  ) {
    if (
      /8\s+gen\s+4/.test(
        normalized
      )
    ) return 9.8;

    if (
      /8\s+gen\s+3/.test(
        normalized
      )
    ) return 9.5;

    if (
      /8\s+gen\s+2/.test(
        normalized
      )
    ) return 9.1;

    if (
      /8\s+gen\s+1/.test(
        normalized
      )
    ) return 8.7;

    if (
      /8s\s+gen\s+3/.test(
        normalized
      )
    ) return 9;

    if (
      /8s\s+gen\s+4/.test(
        normalized
      )
    ) return 9.3;

    if (
      /7\+\s+gen\s+3/.test(
        normalized
      )
    ) return 8.8;

    if (
      /7\s+gen\s+3/.test(
        normalized
      )
    ) return 8.1;

    if (
      /7\s+gen\s+2/.test(
        normalized
      )
    ) return 7.7;

    if (
      /6\s+gen\s+4/.test(
        normalized
      )
    ) return 6.8;

    if (
      /6\s+gen\s+3/.test(
        normalized
      )
    ) return 6.4;

    if (
      /6\s+gen\s+2/.test(
        normalized
      )
    ) return 6;

    const match =
      normalized.match(
        /snapdragon\s+(\d{3,4})/
      );

    if (match?.[1]) {
      const model =
        Number(match[1]);

      if (model >= 800) return 9;
      if (model >= 700) return 7.5;
      if (model >= 600) return 5;

      return 4;
    }
  }

  // ----------------------------------------------------
  // Dimensity
  // ----------------------------------------------------

  const dimensity =
    normalized.match(
      /dimensity\s+(\d{3,5})/
    );

  if (dimensity?.[1]) {
    const model =
      Number(dimensity[1]);

    if (model >= 9000) return 9.5;
    if (model >= 8000) return 8.5;
    if (model >= 7500) return 8;
    if (model >= 7300) return 7.6;
    if (model >= 7000) return 7.3;
    if (model >= 6000) return 6.2;
    if (model >= 5000) return 5.5;

    return 4.5;
  }

  // ----------------------------------------------------
  // Exynos
  // ----------------------------------------------------

  const exynos =
    normalized.match(
      /exynos\s+(\d{3,4})/
    );

  if (exynos?.[1]) {
    const model =
      Number(exynos[1]);

    if (model >= 2400) return 9;
    if (model >= 2200) return 8.5;
    if (model >= 2100) return 8;
    if (model >= 1400) return 6;
    if (model >= 1200) return 5.5;

    return 5;
  }

  // ----------------------------------------------------
  // Helio
  // ----------------------------------------------------

  const helio =
    normalized.match(
      /helio\s+g(\d+)/
    );

  if (helio?.[1]) {
    const model =
      Number(helio[1]);

    if (model >= 200) return 7;
    if (model >= 100) return 6.5;
    if (model >= 90) return 6;
    if (model >= 80) return 5.5;
    if (model >= 70) return 5;

    return 4.5;
  }

  // ----------------------------------------------------
  // Unisoc
  // ----------------------------------------------------

  if (
    normalized.includes(
      "unisoc"
    )
  ) {
    if (
      /t9\d+/i.test(
        normalized
      )
    ) return 6;

    if (
      /t8\d+/i.test(
        normalized
      )
    ) return 5.5;

    if (
      /t7\d+/i.test(
        normalized
      )
    ) return 5;

    return 3.5;
  }

  // ----------------------------------------------------
  // Tensor
  // ----------------------------------------------------

  const tensor =
    normalized.match(
      /tensor\s+g?(\d+)/
    );

  if (tensor?.[1]) {
    const generation =
      Number(tensor[1]);

    if (generation >= 5) return 9;
    if (generation === 4) return 8.5;
    if (generation === 3) return 8;
    if (generation === 2) return 7.2;

    return 6.5;
  }

  return 0;
}

// ======================================================
// Helpers
// ======================================================

function safeNumber(
  value: unknown
): number {
  return typeof value === "number" &&
    Number.isFinite(value)
    ? value
    : 0;
}

function clamp(
  value: number,
  min: number,
  max: number
): number {
  return Math.min(
    max,
    Math.max(
      min,
      value
    )
  );
}

function isIntentType(
  value: unknown
): value is IntentType {
  return (
    value === "gaming" ||
    value === "camera" ||
    value === "battery" ||
    value === "balanced"
  );
}

function formatPrice(
  value: number
): string {
  return new Intl.NumberFormat(
    "en-IN"
  ).format(
    Math.round(value)
  );
}

function formatNumber(
  value: number
): string {
  return new Intl.NumberFormat(
    "en-IN"
  ).format(
    Math.floor(value)
  );
}