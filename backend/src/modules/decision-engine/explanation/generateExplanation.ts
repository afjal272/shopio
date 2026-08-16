import {
  Constraints,
  IntentType,
  Product,
  WeightedIntent,
} from "../types";

import { EXPLANATION } from "../engine/engine.constants";

// ======================================================
// Explanation Generator
// ======================================================

export function generateExplanation(
  product: Product,
  intent: IntentType[] | WeightedIntent[],
  constraints?: Constraints
): string {
  const specs = product.specs ?? {};

  const ram = safeNumber(specs.ram);
  const battery = safeNumber(specs.battery);
  const rating = safeNumber(product.rating);
  const reviews = safeNumber(product.reviewsCount);
  const cameraMp = safeNumber(specs.cameraMp);

  const processor =
    resolveProcessorScore(
      specs.processorScore,
      specs.chipset
    );

  const tags = normalizeTags(
    product.tags
  );

  const intentNames =
    extractIntentNames(intent);

  const reasons: string[] = [];

  // ====================================================
  // Constraint Reasons
  // ====================================================

  addConstraintReasons(
    reasons,
    ram,
    battery,
    rating,
    product.price,
    constraints
  );

  // ====================================================
  // Gaming
  // ====================================================

  if (
    intentNames.includes("gaming")
  ) {
    addGamingReasons(
      reasons,
      processor,
      ram,
      battery,
      tags
    );
  }

  // ====================================================
  // Camera
  // ====================================================

  if (
    intentNames.includes("camera")
  ) {
    addCameraReasons(
      reasons,
      cameraMp,
      rating,
      tags
    );
  }

  // ====================================================
  // Battery
  // ====================================================

  if (
    intentNames.includes("battery")
  ) {
    addBatteryReasons(
      reasons,
      battery,
      rating,
      tags
    );
  }

  // ====================================================
  // Balanced
  // ====================================================

  if (
    intentNames.includes("balanced")
  ) {
    addBalancedReasons(
      reasons,
      ram,
      processor,
      battery,
      rating
    );
  }

  // ====================================================
  // Trust
  // ====================================================

  addTrustReason(
    reasons,
    reviews
  );

  // ====================================================
  // Safe Fallback
  // ====================================================

  if (
    reasons.length === 0
  ) {
    reasons.push(
      buildFallbackReason(
        ram,
        processor,
        battery,
        rating
      )
    );
  }

  // ====================================================
  // Limit Reasons
  // ====================================================

  const finalReasons =
    reasons.slice(
      0,
      EXPLANATION.MAX_REASONS
    );

  // ====================================================
  // Intent Text
  // ====================================================

  const intentText =
    intentNames.length > 1
      ? intentNames.join(" & ")
      : intentNames[0] ??
        "general use";

  // ====================================================
  // Final Explanation
  // ====================================================

  return (
    `${product.name} is a good fit for ` +
    `${intentText} because it offers ` +
    `${finalReasons.join(", ")}.`
  );
}

// ======================================================
// Constraint Reasons
// ======================================================

function addConstraintReasons(
  reasons: string[],
  ram: number,
  battery: number,
  rating: number,
  price: number,
  constraints?: Constraints
): void {
  if (
    constraints?.minRam != null
  ) {
    if (
      ram >= constraints.minRam
    ) {
      reasons.push(
        `${ram}GB RAM meets your requirement`
      );
    } else {
      reasons.push(
        `${ram}GB RAM is below your preferred ${constraints.minRam}GB`
      );
    }
  }

  if (
    constraints?.minBattery != null
  ) {
    if (
      battery >=
      constraints.minBattery
    ) {
      reasons.push(
        `${battery}mAh battery meets your requirement`
      );
    } else {
      reasons.push(
        `${battery}mAh battery is below your preferred ${constraints.minBattery}mAh`
      );
    }
  }

  if (
    constraints?.minRating != null
  ) {
    if (
      rating >=
      constraints.minRating
    ) {
      reasons.push(
        `rating of ${rating.toFixed(1)}⭐ meets your expectation`
      );
    } else {
      reasons.push(
        `rating of ${rating.toFixed(1)}⭐ is below your preferred level`
      );
    }
  }

  if (
    constraints?.minPrice != null &&
    price > 0
  ) {
    if (
      price >=
      constraints.minPrice
    ) {
      reasons.push(
        `price is within your minimum price range`
      );
    }
  }

  if (
    constraints?.maxPrice != null &&
    price > 0
  ) {
    if (
      price <=
      constraints.maxPrice
    ) {
      reasons.push(
        `price fits within your budget constraint`
      );
    } else {
      reasons.push(
        `price exceeds your maximum budget`
      );
    }
  }
}

// ======================================================
// Gaming Reasons
// ======================================================

function addGamingReasons(
  reasons: string[],
  processor: number,
  ram: number,
  battery: number,
  tags: string[]
): void {
  if (
    processor >= 8
  ) {
    reasons.push(
      `strong processor performance (${processor.toFixed(1)}/10)`
    );
  } else if (
    processor >= 6
  ) {
    reasons.push(
      `capable processor performance (${processor.toFixed(1)}/10)`
    );
  } else if (
    processor > 0
  ) {
    reasons.push(
      `entry-level processor performance (${processor.toFixed(1)}/10)`
    );
  } else {
    reasons.push(
      "processor performance data is unavailable"
    );
  }

  if (
    ram >= 12
  ) {
    reasons.push(
      `${ram}GB RAM is well suited to demanding games`
    );
  } else if (
    ram >= 8
  ) {
    reasons.push(
      `${ram}GB RAM is suitable for modern gaming`
    );
  } else if (
    ram > 0
  ) {
    reasons.push(
      `${ram}GB RAM may limit heavier gaming workloads`
    );
  }

  if (
    battery >= 6000
  ) {
    reasons.push(
      `${battery}mAh battery provides strong capacity for longer gaming sessions`
    );
  } else if (
    battery >= 5000
  ) {
    reasons.push(
      `${battery}mAh battery provides solid capacity for gaming`
    );
  }

  if (
    hasAnyTag(
      tags,
      [
        "gaming",
        "gaming phone",
        "performance",
        "performance phone",
      ]
    )
  ) {
    reasons.push(
      "gaming-oriented features are listed"
    );
  }
}

// ======================================================
// Camera Reasons
// ======================================================

function addCameraReasons(
  reasons: string[],
  cameraMp: number,
  rating: number,
  tags: string[]
): void {
  if (
    cameraMp >= 100
  ) {
    reasons.push(
      `${cameraMp}MP main camera provides high-resolution capability`
    );
  } else if (
    cameraMp >= 50
  ) {
    reasons.push(
      `${cameraMp}MP main camera provides solid resolution`
    );
  } else if (
    cameraMp > 0
  ) {
    reasons.push(
      `${cameraMp}MP main camera is suitable for everyday photography`
    );
  } else {
    reasons.push(
      "camera specification data is limited"
    );
  }

  if (
    rating >= 4.3
  ) {
    reasons.push(
      `strong user rating of ${rating.toFixed(1)}⭐`
    );
  } else if (
    rating >= 4
  ) {
    reasons.push(
      `good user rating of ${rating.toFixed(1)}⭐`
    );
  }

  if (
    hasAnyTag(
      tags,
      [
        "camera",
        "camera phone",
        "photography",
        "photography phone",
        "video",
      ]
    )
  ) {
    reasons.push(
      "camera-focused features are listed"
    );
  }
}

// ======================================================
// Battery Reasons
// ======================================================

function addBatteryReasons(
  reasons: string[],
  battery: number,
  rating: number,
  tags: string[]
): void {
  if (
    battery >= 7000
  ) {
    reasons.push(
      `${battery}mAh battery offers very high capacity`
    );
  } else if (
    battery >= 6000
  ) {
    reasons.push(
      `${battery}mAh battery offers high capacity`
    );
  } else if (
    battery >= 5000
  ) {
    reasons.push(
      `${battery}mAh battery offers solid everyday capacity`
    );
  } else if (
    battery > 0
  ) {
    reasons.push(
      `${battery}mAh battery provides average capacity`
    );
  } else {
    reasons.push(
      "battery specification data is unavailable"
    );
  }

  if (
    rating >= 4.3
  ) {
    reasons.push(
      `strong user rating of ${rating.toFixed(1)}⭐`
    );
  }

  if (
    hasAnyTag(
      tags,
      [
        "battery",
        "large battery",
        "large-battery",
        "long battery",
        "long-battery",
        "long battery life",
        "battery backup",
      ]
    )
  ) {
    reasons.push(
      "battery-focused features are listed"
    );
  }
}

// ======================================================
// Balanced Reasons
// ======================================================

function addBalancedReasons(
  reasons: string[],
  ram: number,
  processor: number,
  battery: number,
  rating: number
): void {
  if (
    ram > 0
  ) {
    reasons.push(
      `${ram}GB RAM`
    );
  }

  if (
    processor > 0
  ) {
    reasons.push(
      `processor performance of ${processor.toFixed(1)}/10`
    );
  }

  if (
    battery > 0
  ) {
    reasons.push(
      `${battery}mAh battery`
    );
  }

  if (
    rating > 0
  ) {
    reasons.push(
      `${rating.toFixed(1)}⭐ user rating`
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
  if (
    reviews > 10000
  ) {
    reasons.push(
      `${formatNumber(reviews)}+ reviews provide strong market confidence`
    );
  } else if (
    reviews > 1000
  ) {
    reasons.push(
      `${formatNumber(reviews)}+ reviews provide strong market confidence`
    );
  } else if (
    reviews > 100
  ) {
    reasons.push(
      `${formatNumber(reviews)}+ reviews provide useful market confidence`
    );
  }
}

// ======================================================
// Fallback Reason
// ======================================================

function buildFallbackReason(
  ram: number,
  processor: number,
  battery: number,
  rating: number
): string {
  const available: string[] = [];

  if (
    ram > 0
  ) {
    available.push(
      `${ram}GB RAM`
    );
  }

  if (
    processor > 0
  ) {
    available.push(
      `processor score ${processor.toFixed(1)}/10`
    );
  }

  if (
    battery > 0
  ) {
    available.push(
      `${battery}mAh battery`
    );
  }

  if (
    rating > 0
  ) {
    available.push(
      `${rating.toFixed(1)}⭐ rating`
    );
  }

  if (
    available.length > 0
  ) {
    return available.join(
      ", "
    );
  }

  return (
    "limited specification data"
  );
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
    return [
      "balanced",
    ];
  }

  const names =
    intent
      .map(
        (item) =>
          typeof item ===
          "string"
            ? item
            : item.type
      )
      .filter(
        isIntentType
      );

  return [
    ...new Set(names),
  ];
}

// ======================================================
// Processor Score Resolution
// ======================================================

function resolveProcessorScore(
  processorScore: unknown,
  chipset: unknown
): number {
  const explicit =
    safeNumber(
      processorScore
    );

  if (
    explicit > 0
  ) {
    return clamp(
      explicit,
      0,
      10
    );
  }

  if (
    typeof chipset !==
    "string" ||
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

  if (
    apple?.[1]
  ) {
    const generation =
      Number(
        apple[1]
      );

    if (
      generation >= 19
    ) return 10;

    if (
      generation === 18
    ) return 9.8;

    if (
      generation === 17
    ) return 9.5;

    if (
      generation === 16
    ) return 9.2;

    if (
      generation === 15
    ) return 8.8;

    if (
      generation === 14
    ) return 8.4;

    if (
      generation === 13
    ) return 8;

    if (
      generation === 12
    ) return 7.6;

    if (
      generation === 11
    ) return 7.2;

    if (
      generation === 10
    ) return 6.8;
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
      /8s\s+gen\s+4/.test(
        normalized
      )
    ) return 9.3;

    if (
      /8s\s+gen\s+3/.test(
        normalized
      )
    ) return 9;

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

    if (
      /snapdragon\s+(\d{3,4})/.test(
        normalized
      )
    ) {
      const match =
        normalized.match(
          /snapdragon\s+(\d{3,4})/
        );

      const model =
        Number(
          match?.[1] ?? 0
        );

      if (
        model >= 800
      ) return 9;

      if (
        model >= 700
      ) return 7.5;

      if (
        model >= 600
      ) return 5;

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

  if (
    dimensity?.[1]
  ) {
    const model =
      Number(
        dimensity[1]
      );

    if (
      model >= 9000
    ) return 9.5;

    if (
      model >= 8000
    ) return 8.5;

    if (
      model >= 7500
    ) return 8;

    if (
      model >= 7300
    ) return 7.6;

    if (
      model >= 7000
    ) return 7.3;

    if (
      model >= 6000
    ) return 6.2;

    if (
      model >= 5000
    ) return 5.5;

    return 4.5;
  }

  // ----------------------------------------------------
  // Exynos
  // ----------------------------------------------------

  const exynos =
    normalized.match(
      /exynos\s+(\d{3,4})/
    );

  if (
    exynos?.[1]
  ) {
    const model =
      Number(
        exynos[1]
      );

    if (
      model >= 2400
    ) return 9;

    if (
      model >= 2200
    ) return 8.5;

    if (
      model >= 2100
    ) return 8;

    if (
      model >= 1400
    ) return 6;

    if (
      model >= 1200
    ) return 5.5;

    return 5;
  }

  // ----------------------------------------------------
  // Helio
  // ----------------------------------------------------

  const helio =
    normalized.match(
      /helio\s+g(\d+)/
    );

  if (
    helio?.[1]
  ) {
    const model =
      Number(
        helio[1]
      );

    if (
      model >= 200
    ) return 7;

    if (
      model >= 100
    ) return 6.5;

    if (
      model >= 90
    ) return 6;

    if (
      model >= 80
    ) return 5.5;

    if (
      model >= 70
    ) return 5;

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

  if (
    tensor?.[1]
  ) {
    const generation =
      Number(
        tensor[1]
      );

    if (
      generation >= 5
    ) return 9;

    if (
      generation === 4
    ) return 8.5;

    if (
      generation === 3
    ) return 8;

    if (
      generation === 2
    ) return 7.2;

    return 6.5;
  }

  return 0;
}

// ======================================================
// Tag Matching
// ======================================================

function hasAnyTag(
  tags: string[],
  candidates: string[]
): boolean {
  const normalized =
    candidates.map(
      normalizeText
    );

  return normalized.some(
    (candidate) =>
      tags.includes(
        candidate
      )
  );
}

// ======================================================
// Tag Normalization
// ======================================================

function normalizeTags(
  values: unknown
): string[] {
  if (
    !Array.isArray(values)
  ) {
    return [];
  }

  return [
    ...new Set(
      values
        .filter(
          (
            value
          ): value is string =>
            typeof value ===
            "string"
        )
        .map(
          normalizeText
        )
        .filter(Boolean)
    ),
  ];
}

// ======================================================
// Text Normalization
// ======================================================

function normalizeText(
  value: unknown
): string {
  if (
    typeof value !==
    "string"
  ) {
    return "";
  }

  return value
    .trim()
    .toLowerCase()
    .replace(
      /\s+/g,
      " "
    );
}

// ======================================================
// Intent Type Guard
// ======================================================

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

// ======================================================
// Safe Number
// ======================================================

function safeNumber(
  value: unknown
): number {
  if (
    typeof value !==
      "number" ||
    !Number.isFinite(value)
  ) {
    return 0;
  }

  return value;
}

// ======================================================
// Clamp
// ======================================================

function clamp(
  value: number,
  min: number,
  max: number
): number {
  if (
    !Number.isFinite(value)
  ) {
    return min;
  }

  return Math.min(
    max,
    Math.max(
      min,
      value
    )
  );
}

// ======================================================
// Number Formatting
// ======================================================

function formatNumber(
  value: number
): string {
  return new Intl.NumberFormat(
    "en-IN"
  ).format(
    Math.floor(value)
  );
}