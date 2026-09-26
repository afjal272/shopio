import {
  Constraints,
  IntentType,
  Product,
  WeightedIntent,
} from "../types";

// ======================================================
// Types
// ======================================================

type ScoreComponent =
  | "ram"
  | "processor"
  | "battery"
  | "rating"
  | "camera";

interface ResolvedSignal {
  value: number;
  available: boolean;
}

interface ScoreContext {
  ram: ResolvedSignal;
  processor: ResolvedSignal;
  battery: ResolvedSignal;
  rating: ResolvedSignal;
  camera: ResolvedSignal;

  reviews: number;
  price: number;

  tags: string[];
  brand: string;
  text: string;

  intents: WeightedIntent[];
}

interface Breakdown {
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
}

// ======================================================
// Constants
// ======================================================

const SCORE_MAX = 100;

const PROCESSOR_MAX = 10;

const RAM_REFERENCE_GB = 16;

const BATTERY_REFERENCE_MAH = 7000;

const CAMERA_REFERENCE_MP = 200;

const RATING_REFERENCE = 5;

const MIN_PRICE = 1;

// ======================================================
// Final Score Composition
// ======================================================

const SCORE_COMPOSITION = {
  intent: 0.70,
  priceFit: 0.10,
  constraints: 0.10,
  trust: 0.05,
  value: 0.05,
} as const;

// ======================================================
// Intent Weights
// ======================================================

const INTENT_WEIGHTS: Record<
  IntentType,
  Record<ScoreComponent, number>
> = {
  gaming: {
    ram: 0.30,
    processor: 0.45,
    battery: 0.10,
    rating: 0.10,
    camera: 0.05,
  },

  camera: {
    ram: 0.08,
    processor: 0.12,
    battery: 0.05,
    rating: 0.15,
    camera: 0.60,
  },

  battery: {
    ram: 0.08,
    processor: 0.10,
    battery: 0.65,
    rating: 0.15,
    camera: 0.02,
  },

  balanced: {
    ram: 0.22,
    processor: 0.28,
    battery: 0.20,
    rating: 0.25,
    camera: 0.05,
  },
};

// ======================================================
// Intent Tags
// ======================================================

const INTENT_TAGS: Record<
  IntentType,
  string[]
> = {
  gaming: [
    "gaming",
    "gaming phone",
    "game",
    "performance",
    "performance phone",
    "high performance",
    "high-performance",
  ],

  camera: [
    "camera",
    "camera phone",
    "high-resolution-camera",
    "high resolution camera",
    "photography",
    "photography phone",
    "video",
    "video phone",
  ],

  battery: [
    "battery",
    "large-battery",
    "large battery",
    "long-battery",
    "long battery",
    "long-lasting-battery",
    "long lasting battery",
    "battery backup",
    "long battery life",
  ],

  balanced: [],
};

// ======================================================
// Processor Detection Patterns
// ======================================================

const PROCESSOR_PATTERNS = [
  /\b(?:qualcomm\s+)?snapdragon\s+\d+[a-z]?(?:\s+(?:gen|elite|pro|plus|ultra|prime)(?:\s*\d+[a-z0-9+.-]*)?)?(?:\s+for\s+[a-z]+)?/i,

  /\b(?:mediatek\s+)?dimensity\s+\d+[a-z0-9+.-]*(?:[-\s](?:ultra|max|pro|plus|apex|extreme))?/i,

  /\b(?:mediatek\s+)?helio\s+[a-z]?\d+[a-z0-9+.-]*/i,

  /\b(?:mediatek\s+)?d\d+[a-z0-9+.-]*(?:\s+(?:max|ultra|pro|plus|apex|extreme))?/i,

  /\bmediatek\s+\d+[a-z0-9+.-]*/i,

  /\bexynos\s+\d+[a-z0-9+.-]*/i,

  /\btensor\s+g?\d+(?:\s+(?:pro|tensor))?/i,

  /\b(?:apple\s+)?a\d+(?:\s+(?:bionic|pro|fusion))?/i,

  /\bkirin\s+\d+[a-z0-9+.-]*/i,

  /\b(?:unisoc|spreadtrum)\s+[a-z0-9-]+/i,
];

// ======================================================
// Public API
// ======================================================

export function scoreProduct(
  product: Product,
  intent: IntentType[] | WeightedIntent[],
  budget: number | null,
  constraints?: Constraints,
) {
  const intents =
    normalizeIntent(intent);

  const context =
    buildContext(
      product,
      intents,
    );

  const intentScore =
    calculateIntentScore(
      context,
    );

  const priceFit =
    calculatePriceFit(
      context.price,
      budget,
    );

  const constraintScore =
    constraints
      ? calculateConstraintScore(
          context,
          constraints,
        )
      : 1;

  const trustScore =
    calculateTrustScore(
      context.reviews,
    );

  const valueScore =
    calculateValueScoreNormalized(
      context,
    );

  const tagScore =
    calculateIntentTagScore(
      context,
    );

  const finalIntentScore =
    clamp(
      intentScore * 0.95 +
        tagScore * 0.05,
      0,
      1,
    );

  const tieBreaker =
    calculateTieBreaker(
      context,
    );

  const finalScore =
    clamp(
      finalIntentScore *
        SCORE_COMPOSITION.intent +
        priceFit *
          SCORE_COMPOSITION.priceFit +
        constraintScore *
          SCORE_COMPOSITION.constraints +
        trustScore *
          SCORE_COMPOSITION.trust +
        valueScore *
          SCORE_COMPOSITION.value +
        tieBreaker,
      0,
      1,
    );

  const calibratedScore =
    Math.round(
      finalScore *
        SCORE_MAX *
        100,
    ) / 100;

  const breakdown: Breakdown = {
    ram: toPercentage(
      context.ram.value,
    ),

    processor:
      toPercentage(
        context.processor
          .value,
      ),

    battery:
      toPercentage(
        context.battery.value,
      ),

    rating:
      toPercentage(
        context.rating.value,
      ),

    brand: 0,

    tags:
      toPercentage(
        tagScore,
      ),

    trust:
      toPercentage(
        trustScore,
      ),

    value:
      toPercentage(
        valueScore,
      ),

    priceFit:
      toPercentage(
        priceFit,
      ),

    constraints:
      toPercentage(
        constraintScore,
      ),

    tieBreaker:
      toPercentage(
        tieBreaker,
      ),

    total:
      calibratedScore,
  };

  return {
    total:
      calibratedScore,

    breakdown,
  };
}

// ======================================================
// Context
// ======================================================

function buildContext(
  product: Product,
  intents: WeightedIntent[],
): ScoreContext {
  const text =
    buildSearchableText(
      product,
    );

  return {
    ram:
      resolveRamGb(
        product,
        text,
      ),

    processor:
      resolveProcessorScore(
        product,
        text,
      ),

    battery:
      resolveBatteryMah(
        product,
        text,
      ),

    camera:
      resolveCameraMp(
        product,
        text,
      ),

    rating:
      resolveRating(
        product.rating,
      ),

    reviews:
      Math.max(
        0,
        safeNumber(
          product.reviewsCount,
        ),
      ),

    price:
      Math.max(
        0,
        safeNumber(
          product.price,
        ),
      ),

    tags:
      normalizeTags(
        product.tags,
      ),

    brand:
      normalizeText(
        product.brand,
      ),

    text,

    intents,
  };
}

// ======================================================
// Intent Score
// ======================================================

function calculateIntentScore(
  context: ScoreContext,
): number {
  let weightedTotal =
    0;

  let intentWeightTotal =
    0;

  for (
    const intent of
      context.intents
  ) {
    const weights =
      INTENT_WEIGHTS[
        intent.type
      ];

    if (
      !weights ||
      intent.weight <= 0
    ) {
      continue;
    }

    const signals:
      Array<
        [
          ScoreComponent,
          ResolvedSignal,
        ]
      > = [
      [
        "ram",
        context.ram,
      ],
      [
        "processor",
        context.processor,
      ],
      [
        "battery",
        context.battery,
      ],
      [
        "rating",
        context.rating,
      ],
      [
        "camera",
        context.camera,
      ],
    ];

    let weightedSignal =
      0;

    let availableWeight =
      0;

    for (
      const [
        component,
        signal,
      ] of signals
    ) {
      const componentWeight =
        weights[
          component
        ];

      if (
        componentWeight <= 0 ||
        !signal.available
      ) {
        continue;
      }

      weightedSignal +=
        signal.value *
        componentWeight;

      availableWeight +=
        componentWeight;
    }

    if (
      availableWeight <=
      0
    ) {
      continue;
    }

    const intentScore =
      weightedSignal /
      availableWeight;

    const totalWeight =
      Object.values(
        weights,
      ).reduce(
        (
          sum,
          value,
        ) =>
          sum + value,
        0,
      );

    const coverage =
      totalWeight > 0
        ? availableWeight /
          totalWeight
        : 0;

    const coverageFactor =
      0.85 +
      coverage * 0.15;

    weightedTotal +=
      intentScore *
      coverageFactor *
      intent.weight;

    intentWeightTotal +=
      intent.weight;
  }

  if (
    intentWeightTotal <=
    0
  ) {
    return 0;
  }

  return clamp(
    weightedTotal /
      intentWeightTotal,
    0,
    1,
  );
}

// ======================================================
// Intent Tag Score
// ======================================================

function calculateIntentTagScore(
  context: ScoreContext,
): number {
  let total = 0;

  let weightTotal = 0;

  for (
    const intent of
      context.intents
  ) {
    if (
      intent.type ===
        "balanced" ||
      intent.weight <= 0
    ) {
      continue;
    }

    const candidates =
      INTENT_TAGS[
        intent.type
      ];

    if (
      !candidates?.length
    ) {
      continue;
    }

    const matched =
      candidates.some(
        (tag) =>
          context.tags.includes(
            normalizeText(
              tag,
            ),
          ) ||
          context.text.includes(
            normalizeText(
              tag,
            ),
          ),
      );

    total +=
      (matched ? 1 : 0) *
      intent.weight;

    weightTotal +=
      intent.weight;
  }

  if (
    weightTotal <= 0
  ) {
    return 0;
  }

  return clamp(
    total /
      weightTotal,
    0,
    1,
  );
}

// ======================================================
// Price Fit
// ======================================================

function calculatePriceFit(
  price: number,
  budget: number | null,
): number {
  if (
    budget == null ||
    budget <= 0 ||
    price < MIN_PRICE
  ) {
    return 0;
  }

  const utilization =
    price / budget;

  if (
    utilization <=
    0.85
  ) {
    return 0.78;
  }

  if (
    utilization <=
    0.95
  ) {
    return 0.92;
  }

  if (
    utilization <=
    1
  ) {
    return 1;
  }

  if (
    utilization <=
    1.05
  ) {
    return 0.72;
  }

  if (
    utilization <=
    1.1
  ) {
    return 0.55;
  }

  if (
    utilization <=
    1.2
  ) {
    return 0.3;
  }

  if (
    utilization <=
    1.35
  ) {
    return 0.1;
  }

  return 0;
}

// ======================================================
// Constraint Score
// ======================================================

function calculateConstraintScore(
  context: ScoreContext,
  constraints: Constraints,
): number {
  const results: number[] =
    [];

  const ram =
    context.ram.available
      ? context.ram.value *
        RAM_REFERENCE_GB
      : null;

  const battery =
    context.battery.available
      ? denormalizeBattery(
          context.battery.value,
        )
      : null;

  const rating =
    context.rating.available
      ? context.rating.value *
        RATING_REFERENCE
      : null;

  const price =
    context.price;

  if (
    constraints.minRam !=
    null
  ) {
    results.push(
      ram == null
        ? 0
        : ram >=
            constraints.minRam
          ? 1
          : 0,
    );
  }

  if (
    constraints.maxRam !=
    null
  ) {
    results.push(
      ram == null
        ? 0
        : ram <=
            constraints.maxRam
          ? 1
          : 0,
    );
  }

  if (
    constraints.minBattery !=
    null
  ) {
    results.push(
      battery == null
        ? 0
        : battery >=
            constraints.minBattery
          ? 1
          : 0,
    );
  }

  if (
    constraints.maxBattery !=
    null
  ) {
    results.push(
      battery == null
        ? 0
        : battery <=
            constraints.maxBattery
          ? 1
          : 0,
    );
  }

  if (
    constraints.minRating !=
    null
  ) {
    results.push(
      rating == null
        ? 0
        : rating >=
            constraints.minRating
          ? 1
          : 0,
    );
  }

  if (
    constraints.maxRating !=
    null
  ) {
    results.push(
      rating == null
        ? 0
        : rating <=
            constraints.maxRating
          ? 1
          : 0,
    );
  }

  if (
    constraints.minPrice !=
    null
  ) {
    results.push(
      price >=
        constraints.minPrice
        ? 1
        : 0,
    );
  }

  if (
    constraints.maxPrice !=
    null
  ) {
    results.push(
      price <=
        constraints.maxPrice
        ? 1
        : 0,
    );
  }

  if (
    constraints.preferredBrands
      ?.length
  ) {
    const preferred =
      constraints.preferredBrands.some(
        (brand) =>
          normalizeText(
            brand,
          ) ===
          context.brand,
      );

    results.push(
      preferred
        ? 1
        : 0.5,
    );
  }

  if (
    constraints.excludedBrands
      ?.length
  ) {
    const excluded =
      constraints.excludedBrands.some(
        (brand) =>
          normalizeText(
            brand,
          ) ===
          context.brand,
      );

    results.push(
      excluded
        ? 0
        : 1,
    );
  }

  if (
    constraints.requiredTags
      ?.length
  ) {
    const required =
      constraints.requiredTags
        .map(
          normalizeText,
        )
        .filter(Boolean);

    if (
      required.length >
      0
    ) {
      const matched =
        required.filter(
          (tag) =>
            context.tags.includes(
              tag,
            ) ||
            context.text.includes(
              tag,
            ),
        ).length;

      results.push(
        matched /
          required.length,
      );
    }
  }

  if (
    constraints.excludedTags
      ?.length
  ) {
    const excluded =
      constraints.excludedTags
        .map(
          normalizeText,
        )
        .filter(Boolean);

    const hasExcluded =
      excluded.some(
        (tag) =>
          context.tags.includes(
            tag,
          ) ||
          context.text.includes(
            tag,
          ),
      );

    results.push(
      hasExcluded
        ? 0
        : 1,
    );
  }

  if (
    results.length ===
    0
  ) {
    return 1;
  }

  return clamp(
    results.reduce(
      (
        sum,
        value,
      ) =>
        sum + value,
      0,
    ) /
      results.length,
    0,
    1,
  );
}

// ======================================================
// Trust Score
// ======================================================

function calculateTrustScore(
  reviews: number,
): number {
  if (
    reviews <= 0
  ) {
    return 0;
  }

  return clamp(
    Math.log10(
      reviews + 1,
    ) / 5,
    0,
    1,
  );
}

// ======================================================
// Value Score
// ======================================================

function calculateValueScoreNormalized(
  context: ScoreContext,
): number {
  if (
    context.price <=
    0
  ) {
    return 0;
  }

  const signals: Array<{
    value: number;
    weight: number;
    available: boolean;
  }> = [
    {
      value:
        context.processor
          .value,
      weight: 0.4,
      available:
        context.processor
          .available,
    },

    {
      value:
        context.ram.value,
      weight: 0.3,
      available:
        context.ram.available,
    },

    {
      value:
        context.battery
          .value,
      weight: 0.3,
      available:
        context.battery
          .available,
    },
  ];

  const availableSignals =
    signals.filter(
      (
        signal,
      ) =>
        signal.available,
    );

  if (
    availableSignals.length ===
    0
  ) {
    return 0;
  }

  const availableWeight =
    availableSignals.reduce(
      (
        sum,
        signal,
      ) =>
        sum +
        signal.weight,
      0,
    );

  const capability =
    availableSignals.reduce(
      (
        sum,
        signal,
      ) =>
        sum +
        signal.value *
          signal.weight,
      0,
    ) /
    availableWeight;

  const priceFactor =
    Math.min(
      1,
      30000 /
        Math.max(
          context.price,
          1,
        ),
    );

  return clamp(
    capability *
      (
        0.65 +
        priceFactor *
          0.35
      ),
    0,
    1,
  );
}

// ======================================================
// Tie Breaker
// ======================================================

function calculateTieBreaker(
  context: ScoreContext,
): number {
  const reviewSignal =
    Math.min(
      1,
      Math.log10(
        context.reviews +
          1,
      ) / 5,
    );

  const ratingSignal =
    context.rating.available
      ? context.rating.value
      : 0;

  return clamp(
    reviewSignal *
        0.0008 +
      ratingSignal *
        0.0005,
    0,
    0.0013,
  );
}

// ======================================================
// Processor Resolution
// ======================================================

function resolveProcessorScore(
  product: Product,
  text: string,
): ResolvedSignal {
  /*
   * Structured/canonical processor data is authoritative.
   *
   * The previous implementation checked title text first,
   * which caused generic words/specs from the title to override
   * the actual normalized processor value.
   */
  const structuredProcessor =
    typeof product.specs
      ?.chipset ===
    "string"
      ? product.specs.chipset
      : typeof product.specs
            ?.processor ===
          "string"
        ? product.specs.processor
        : "";

  if (
    structuredProcessor.trim()
      .length > 0
  ) {
    const score =
      getProcessorScore(
        structuredProcessor,
      );

    if (
      score > 0
    ) {
      return {
        value: normalize(
          score,
          PROCESSOR_MAX,
        ),
        available: true,
      };
    }
  }

  /*
   * Text fallback remains available for products whose
   * structured processor field is genuinely absent.
   */
  const sourceProcessor =
    extractProcessorName(
      text,
    );

  if (
    sourceProcessor
  ) {
    const score =
      getProcessorScore(
        sourceProcessor,
      );

    if (
      score > 0
    ) {
      return {
        value: normalize(
          score,
          PROCESSOR_MAX,
        ),
        available: true,
      };
    }
  }

  /*
   * Preserve compatibility with legacy processorScore.
   */
  const legacyScore =
    safeNumber(
      product.specs
        ?.processorScore,
    );

  if (
    legacyScore > 0
  ) {
    const normalizedLegacyScore =
      legacyScore >
        PROCESSOR_MAX
        ? legacyScore / 10
        : legacyScore;

    return {
      value: normalize(
        normalizedLegacyScore,
        PROCESSOR_MAX,
      ),
      available: true,
    };
  }

  return {
    value: 0,
    available: false,
  };
}

// ======================================================
// Processor Scoring
// ======================================================

function getProcessorScore(
  chipset: string,
): number {
  const normalized =
    normalizeText(
      chipset,
    )
      .replace(
        /[®™]/g,
        "",
      )
      .replace(
        /\s+/g,
        " ",
      );

  // ----------------------------------------------------
  // Snapdragon
  // ----------------------------------------------------

  const snapdragon =
    normalized.match(
      /snapdragon\s+(.+)/i,
    );

  if (
    snapdragon?.[1]
  ) {
    const model =
      snapdragon[1];

    const elite =
      model.match(
        /8\s+elite(?:\s+gen\s*(\d+))?/i,
      );

    if (
      elite
    ) {
      const generation =
        safeNumber(
          elite[1] ??
            "1",
        );

      return generation >=
        1
        ? 10
        : 9.8;
    }

    const eight =
      model.match(
        /8\s+gen\s*(\d+)/i,
      );

    if (
      eight
    ) {
      const generation =
        safeNumber(
          eight[1],
        );

      if (
        generation >= 5
      ) {
        return 10;
      }

      if (
        generation === 4
      ) {
        return 9.8;
      }

      if (
        generation === 3
      ) {
        return 9.5;
      }

      if (
        generation === 2
      ) {
        return 9.1;
      }

      return 8.7;
    }

    const sevenPlus =
      model.match(
        /7\+?\s+gen\s*(\d+)/i,
      );

    if (
      sevenPlus
    ) {
      const generation =
        safeNumber(
          sevenPlus[1],
        );

      if (
        generation >= 4
      ) {
        return 9;
      }

      if (
        generation === 3
      ) {
        return 8.8;
      }

      if (
        generation === 2
      ) {
        return 8.3;
      }

      return 8;
    }

    const seven =
      model.match(
        /7s?\s+gen\s*(\d+)/i,
      );

    if (
      seven
    ) {
      const generation =
        safeNumber(
          seven[1],
        );

      if (
        generation >= 4
      ) {
        return 8.4;
      }

      if (
        generation === 3
      ) {
        return 8.1;
      }

      if (
        generation === 2
      ) {
        return 7.7;
      }

      return 7.3;
    }

    const six =
      model.match(
        /6s?\s+gen\s*(\d+)/i,
      );

    if (
      six
    ) {
      const generation =
        safeNumber(
          six[1],
        );

      if (
        generation >= 4
      ) {
        return 6.8;
      }

      if (
        generation === 3
      ) {
        return 6.4;
      }

      if (
        generation === 2
      ) {
        return 6;
      }

      return 5.5;
    }

    const numeric =
      model.match(
        /\b(\d{3,4})\b/,
      );

    if (
      numeric
    ) {
      const series =
        safeNumber(
          numeric[1],
        );

      if (
        series >= 800
      ) {
        return 9;
      }

      if (
        series >= 700
      ) {
        return 7.5;
      }

      if (
        series >= 600
      ) {
        return 5.5;
      }

      if (
        series >= 400
      ) {
        return 4;
      }
    }
  }

  // ----------------------------------------------------
  // Dimensity
  // ----------------------------------------------------

  const dimensity =
    normalized.match(
      /dimensity\s+(\d{3,5})/i,
    );

  if (
    dimensity
  ) {
    const model =
      safeNumber(
        dimensity[1],
      );

    if (
      model >= 9500
    ) {
      return 9.8;
    }

    if (
      model >= 9000
    ) {
      return 9.5;
    }

    if (
      model >= 8500
    ) {
      return 9;
    }

    if (
      model >= 8000
    ) {
      return 8.5;
    }

    if (
      model >= 7500
    ) {
      return 8;
    }

    if (
      model >= 7300
    ) {
      return 7.6;
    }

    if (
      model >= 7000
    ) {
      return 7.3;
    }

    if (
      model >= 6500
    ) {
      return 6.8;
    }

    if (
      model >= 6300
    ) {
      return 6.5;
    }

    if (
      model >= 6000
    ) {
      return 6.2;
    }

    if (
      model >= 5000
    ) {
      return 5.5;
    }

    if (
      model >= 4000
    ) {
      return 4.5;
    }
  }

  // ----------------------------------------------------
  // MediaTek D-Series
  // ----------------------------------------------------

  const mediatekD =
    normalized.match(
      /\b(?:mediatek\s+)?d(\d{3,5})\b/i,
    );

  if (
    mediatekD
  ) {
    const model =
      safeNumber(
        mediatekD[1],
      );

    if (
      model >= 9000
    ) {
      return 9.4;
    }

    if (
      model >= 8000
    ) {
      return 8.7;
    }

    if (
      model >= 7000
    ) {
      return 7.5;
    }

    if (
      model >= 6000
    ) {
      return 6.8;
    }

    if (
      model >= 5000
    ) {
      return 6;
    }

    if (
      model >= 4000
    ) {
      return 5.2;
    }

    return 4.5;
  }

  // ----------------------------------------------------
  // MediaTek Numeric
  // ----------------------------------------------------

  const mediatekNumeric =
    normalized.match(
      /\bmediatek\s+(\d{3,5})\b/i,
    );

  if (
    mediatekNumeric
  ) {
    const model =
      safeNumber(
        mediatekNumeric[1],
      );

    if (
      model >= 9000
    ) {
      return 9;
    }

    if (
      model >= 8000
    ) {
      return 8.3;
    }

    if (
      model >= 7000
    ) {
      return 7.3;
    }

    if (
      model >= 6000
    ) {
      return 6.4;
    }

    if (
      model >= 5000
    ) {
      return 5.5;
    }

    return 4.5;
  }

  // ----------------------------------------------------
  // Exynos
  // ----------------------------------------------------

  const exynos =
    normalized.match(
      /exynos\s+(\d{3,4})/i,
    );

  if (
    exynos
  ) {
    const model =
      safeNumber(
        exynos[1],
      );

    if (
      model >= 2500
    ) {
      return 9.4;
    }

    if (
      model >= 2400
    ) {
      return 9;
    }

    if (
      model >= 2300
    ) {
      return 8.7;
    }

    if (
      model >= 2200
    ) {
      return 8.5;
    }

    if (
      model >= 2100
    ) {
      return 8;
    }

    if (
      model >= 2000
    ) {
      return 7.4;
    }

    if (
      model >= 1400
    ) {
      return 6;
    }

    if (
      model >= 1300
    ) {
      return 5.7;
    }

    if (
      model >= 1200
    ) {
      return 5.5;
    }

    if (
      model >= 1000
    ) {
      return 5;
    }
  }

  // ----------------------------------------------------
  // Helio
  // ----------------------------------------------------

  const helio =
    normalized.match(
      /helio\s+([a-z])?(\d+)/i,
    );

  if (
    helio
  ) {
    const prefix =
      normalizeText(
        helio[1] ??
          "",
      );

    const model =
      safeNumber(
        helio[2],
      );

    if (
      prefix ===
      "g"
    ) {
      if (
        model >= 200
      ) {
        return 7;
      }

      if (
        model >= 100
      ) {
        return 6.5;
      }

      if (
        model >= 90
      ) {
        return 5.8;
      }

      if (
        model >= 80
      ) {
        return 5.3;
      }

      if (
        model >= 70
      ) {
        return 5;
      }

      if (
        model >= 60
      ) {
        return 4.7;
      }

      if (
        model >= 50
      ) {
        return 4.4;
      }
    }

    if (
      prefix ===
      "p"
    ) {
      if (
        model >= 100
      ) {
        return 5;
      }

      if (
        model >= 90
      ) {
        return 4.5;
      }

      return 4;
    }
  }

  // ----------------------------------------------------
  // Tensor
  // ----------------------------------------------------

  const tensor =
    normalized.match(
      /tensor\s+g?(\d+)/i,
    );

  if (
    tensor
  ) {
    const generation =
      safeNumber(
        tensor[1],
      );

    if (
      generation >= 5
    ) {
      return 9;
    }

    if (
      generation === 4
    ) {
      return 8.5;
    }

    if (
      generation === 3
    ) {
      return 8;
    }

    if (
      generation === 2
    ) {
      return 7.2;
    }

    return 6.5;
  }

  // ----------------------------------------------------
  // Kirin
  // ----------------------------------------------------

  const kirin =
    normalized.match(
      /kirin\s+(\d{3,4})/i,
    );

  if (
    kirin
  ) {
    const model =
      safeNumber(
        kirin[1],
      );

    if (
      model >= 9000
    ) {
      return 9.2;
    }

    if (
      model >= 8000
    ) {
      return 8.2;
    }

    if (
      model >= 7000
    ) {
      return 6.8;
    }

    if (
      model >= 6000
    ) {
      return 5.8;
    }

    if (
      model >= 5000
    ) {
      return 5;
    }
  }

  // ----------------------------------------------------
  // Apple A-Series
  // ----------------------------------------------------

  const apple =
    normalized.match(
      /\ba(\d+)\b/i,
    );

  if (
    apple
  ) {
    const generation =
      safeNumber(
        apple[1],
      );

    if (
      generation >= 19
    ) {
      return 10;
    }

    if (
      generation === 18
    ) {
      return 9.8;
    }

    if (
      generation === 17
    ) {
      return 9.5;
    }

    if (
      generation === 16
    ) {
      return 9.2;
    }

    if (
      generation === 15
    ) {
      return 8.8;
    }

    if (
      generation === 14
    ) {
      return 8.4;
    }

    if (
      generation === 13
    ) {
      return 8;
    }

    if (
      generation === 12
    ) {
      return 7.6;
    }

    if (
      generation === 11
    ) {
      return 7.2;
    }

    if (
      generation === 10
    ) {
      return 6.8;
    }
  }

  // ----------------------------------------------------
  // Unisoc / Spreadtrum
  // ----------------------------------------------------

  const unisoc =
    normalized.match(
      /\b(?:unisoc|spreadtrum)\s+([a-z]?\d+)/i,
    );

  if (
    unisoc
  ) {
    const model =
      unisoc[1];

    const number =
      safeNumber(
        model.replace(
          /[^\d]/g,
          "",
        ),
      );

    if (
      /t\d+/i.test(
        model,
      )
    ) {
      if (
        number >= 900
      ) {
        return 6;
      }

      if (
        number >= 800
      ) {
        return 5.5;
      }

      if (
        number >= 700
      ) {
        return 5;
      }

      if (
        number >= 600
      ) {
        return 4.5;
      }
    }
  }

  return 0;
}

// ======================================================
// RAM
// ======================================================

function resolveRamGb(
  product: Product,
  text: string,
): ResolvedSignal {
  /*
   * Canonical structured RAM wins over text.
   *
   * This is critical because the test suite and the production
   * database both rely on normalized product.specs.
   */
  const explicit =
    parseRamGb(
      product.specs?.ram,
    );

  if (
    explicit > 0
  ) {
    return {
      value: normalize(
        explicit,
        RAM_REFERENCE_GB,
      ),
      available: true,
    };
  }

  /*
   * Explicit labelled text.
   */
  const labelledMatch =
    text.match(
      /\b(?:ram|memory|system memory|installed memory|ram size|memory size)\s*[:=\-]?\s*(\d+(?:\.\d+)?)\s*(?:gb|gib)\b/i,
    );

  if (
    labelledMatch
  ) {
    const value =
      safeNumber(
        labelledMatch[1],
      );

    if (
      value >= 1 &&
      value <= 64
    ) {
      return {
        value: normalize(
          value,
          RAM_REFERENCE_GB,
        ),
        available: true,
      };
    }
  }

  /*
   * 4GB+128GB
   * 128GB+4GB
   * 8GB/256GB
   * 256GB/8GB
   */
  const paired =
    text.match(
      /\b(\d+(?:\.\d+)?)\s*(gb|gib)\s*(?:ram\s*)?(?:\+|\/|\|)\s*(\d+(?:\.\d+)?)\s*(gb|gib|tb)\b/i,
    );

  if (
    paired
  ) {
    const first =
      normalizeCapacityToGb(
        safeNumber(
          paired[1],
        ),
        paired[2],
      );

    const second =
      normalizeCapacityToGb(
        safeNumber(
          paired[3],
        ),
        paired[4],
      );

    const ram =
      Math.min(
        first,
        second,
      );

    const storage =
      Math.max(
        first,
        second,
      );

    if (
      ram >= 1 &&
      ram <= 64 &&
      storage >= 16 &&
      storage <= 16384 &&
      storage > ram
    ) {
      return {
        value: normalize(
          ram,
          RAM_REFERENCE_GB,
        ),
        available: true,
      };
    }
  }

  /*
   * Amazon malformed representation:
   *
   * 12, GB, 256
   */
  const compact =
    text.match(
      /\b(\d{1,2})\s*,\s*gb\s*,\s*(\d{2,5})\b/i,
    );

  if (
    compact
  ) {
    const ram =
      safeNumber(
        compact[1],
      );

    const storage =
      safeNumber(
        compact[2],
      );

    if (
      ram >= 1 &&
      ram <= 64 &&
      storage >= 16 &&
      storage > ram
    ) {
      return {
        value: normalize(
          ram,
          RAM_REFERENCE_GB,
        ),
        available: true,
      };
    }
  }

  /*
   * Adjacent capacities.
   *
   * A single 64GB/128GB value is never interpreted as RAM.
   */
  const capacities =
    [
      ...text.matchAll(
        /\b(\d+(?:\.\d+)?)\s*(gb|gib|tb)\b/gi,
      ),
    ].map(
      (
        match,
      ) => ({
        value:
          normalizeCapacityToGb(
            safeNumber(
              match[1],
            ),
            match[2],
          ),
      }),
    );

  if (
    capacities.length >=
    2
  ) {
    for (
      let index = 0;
      index <
        capacities.length -
          1;
      index += 1
    ) {
      const first =
        capacities[index];

      const second =
        capacities[
          index + 1
        ];

      if (
        !first ||
        !second
      ) {
        continue;
      }

      const ram =
        Math.min(
          first.value,
          second.value,
        );

      const storage =
        Math.max(
          first.value,
          second.value,
        );

      if (
        ram >= 1 &&
        ram <= 64 &&
        storage >= 16 &&
        storage <= 16384 &&
        storage > ram
      ) {
        return {
          value: normalize(
            ram,
            RAM_REFERENCE_GB,
          ),
          available: true,
        };
      }
    }
  }

  return {
    value: 0,
    available: false,
  };
}

// ======================================================
// RAM Parser
// ======================================================

function normalizeCapacityToGb(
  value: number,
  unit: string,
): number {
  if (
    !Number.isFinite(
      value,
    ) ||
    value <= 0
  ) {
    return 0;
  }

  return unit.toLowerCase() ===
    "tb"
    ? value * 1024
    : value;
}

function parseRamGb(
  value: unknown,
): number {
  if (
    typeof value ===
    "number"
  ) {
    return Number.isFinite(
      value,
    ) &&
      value >= 1 &&
      value <= 64
      ? value
      : 0;
  }

  if (
    typeof value !==
    "string"
  ) {
    return 0;
  }

  const normalized =
    value
      .toLowerCase()
      .replace(
        /,/g,
        "",
      )
      .trim();

  if (
    !normalized
  ) {
    return 0;
  }

  const labelled =
    normalized.match(
      /\b(?:ram|memory)\s*[:=\-]?\s*(\d+(?:\.\d+)?)\s*gb\b/i,
    );

  if (
    labelled
  ) {
    const ram =
      safeNumber(
        labelled[1],
      );

    return ram >= 1 &&
      ram <= 64
      ? ram
      : 0;
  }

  const paired =
    normalized.match(
      /\b(\d+(?:\.\d+)?)\s*gb\s*(?:\+|\/|\|)\s*(\d+(?:\.\d+)?)\s*(gb|tb)\b/i,
    );

  if (
    paired
  ) {
    const first =
      normalizeCapacityToGb(
        safeNumber(
          paired[1],
        ),
        "GB",
      );

    const second =
      normalizeCapacityToGb(
        safeNumber(
          paired[2],
        ),
        paired[3],
      );

    const ram =
      Math.min(
        first,
        second,
      );

    const storage =
      Math.max(
        first,
        second,
      );

    return ram >= 1 &&
      ram <= 64 &&
      storage > ram
      ? ram
      : 0;
  }

  return 0;
}

// ======================================================
// Battery
// ======================================================

function resolveBatteryMah(
  product: Product,
  text: string,
): ResolvedSignal {
  /*
   * Canonical structured battery wins over generic title text.
   */
  const explicit =
    safeNumber(
      product.specs
        ?.battery,
    );

  if (
    explicit >= 2000 &&
    explicit <= 30000
  ) {
    return {
      value:
        normalizeBattery(
          explicit,
        ),
      available: true,
    };
  }

  /*
   * Amazon variants:
   *
   * 5000mAh
   * 7000mAhA
   * 6580mAh Si/C
   * 6500mAhSi/C
   */
  const match =
    text.match(
      /\b(\d{3,5})\s*mAh(?:[A-Za-z])?\b/i,
    );

  if (
    match
  ) {
    const value =
      safeNumber(
        match[1],
      );

    if (
      value >= 2000 &&
      value <= 20000
    ) {
      return {
        value:
          normalizeBattery(
            value,
          ),
        available: true,
      };
    }
  }

  return {
    value: 0,
    available: false,
  };
}

// ======================================================
// Battery Normalization
// ======================================================

function normalizeBattery(
  value: number,
): number {
  if (
    !Number.isFinite(
      value,
    ) ||
    value <= 0
  ) {
    return 0;
  }

  const floor =
    2500;

  return clamp(
    (
      value -
      floor
    ) /
      (
        BATTERY_REFERENCE_MAH -
        floor
      ),
    0,
    1,
  );
}

function denormalizeBattery(
  value: number,
): number {
  return (
    value *
      (
        BATTERY_REFERENCE_MAH -
        2500
      ) +
    2500
  );
}

// ======================================================
// Camera
// ======================================================

function resolveCameraMp(
  product: Product,
  text: string,
): ResolvedSignal {
  /*
   * Canonical structured camera wins over text fallback.
   */
  const explicit =
    safeNumber(
      product.specs
        ?.cameraMp,
    );

  if (
    explicit >= 2 &&
    explicit <= 500
  ) {
    return {
      value:
        normalizeCamera(
          explicit,
        ),
      available: true,
    };
  }

  /*
   * Support:
   * 50MP
   * 108 MP
   * 200MP
   * 200MasterPixel
   * 64 Master Pixel
   */
  const matches =
    [
      ...text.matchAll(
        /\b(\d+(?:\.\d+)?)\s*(?:mp|megapixel|master\s*pixel)\b/gi,
      ),
    ];

  const values =
    matches
      .map(
        (
          match,
        ) =>
          safeNumber(
            match[1],
          ),
      )
      .filter(
        (value) =>
          value >= 2 &&
          value <= 500,
      );

  if (
    values.length > 0
  ) {
    return {
      value:
        normalizeCamera(
          Math.max(
            ...values,
          ),
        ),
      available: true,
    };
  }

  return {
    value: 0,
    available: false,
  };
}

// ======================================================
// Camera Normalization
// ======================================================

function normalizeCamera(
  value: number,
): number {
  if (
    !Number.isFinite(
      value,
    ) ||
    value <= 0
  ) {
    return 0;
  }

  const floor =
    8;

  if (
    value <= floor
  ) {
    return clamp(
      (
        value /
        floor
      ) *
        0.2,
      0,
      0.2,
    );
  }

  const relative =
    Math.log1p(
      value -
        floor,
    ) /
    Math.log1p(
      CAMERA_REFERENCE_MP -
        floor,
    );

  return clamp(
    0.2 +
      relative *
        0.8,
    0,
    1,
  );
}

// ======================================================
// Rating
// ======================================================

function resolveRating(
  value: unknown,
): ResolvedSignal {
  const rating =
    safeNumber(
      value,
    );

  if (
    rating > 0 &&
    rating <= 5
  ) {
    return {
      value: normalize(
        rating,
        RATING_REFERENCE,
      ),
      available: true,
    };
  }

  return {
    value: 0,
    available: false,
  };
}

// ======================================================
// Generic Normalization
// ======================================================

function normalize(
  value: number,
  reference: number,
): number {
  if (
    !Number.isFinite(
      value,
    ) ||
    value <= 0 ||
    reference <= 0
  ) {
    return 0;
  }

  return clamp(
    value /
      reference,
    0,
    1,
  );
}

// ======================================================
// Processor Extraction
// ======================================================

function extractProcessorName(
  text: string,
): string {
  for (
    const pattern of
      PROCESSOR_PATTERNS
  ) {
    const match =
      text.match(
        pattern,
      );

    if (
      !match?.[0]
    ) {
      continue;
    }

    let candidate =
      match[0]
        .replace(
          /[®™]/g,
          "",
        )
        .replace(
          /\s+/g,
          " ",
        )
        .trim();

    candidate =
      candidate
        .replace(
          /\s+\d{1,4}(?:\.\d+)?\s*(?:mp|megapixel|master\s*pixel)\b[\s\S]*$/i,
          "",
        )
        .replace(
          /\s+\d{4,5}\s*mAh(?:[A-Za-z])?\b[\s\S]*$/i,
          "",
        )
        .replace(
          /\s+\d{1,2}\s*(?:gb|gib)\s*ram\b[\s\S]*$/i,
          "",
        )
        .replace(
          /\s+\d{1,5}(?:\.\d+)?\s*(?:gb|gib|tb)\s*(?:storage|rom)\b[\s\S]*$/i,
          "",
        )
        .trim();

    if (
      candidate
    ) {
      return candidate;
    }
  }

  return "";
}

// ======================================================
// Searchable Product Text
// ======================================================

function buildSearchableText(
  product: Product,
): string {
  return [
    product.name,

    product.description,

    ...(product.highlights ??
      []),

    ...(product.tags ??
      []),

    typeof product.specs
      ?.chipset ===
    "string"
      ? product.specs
          .chipset
      : "",

    typeof product.specs
      ?.processor ===
    "string"
      ? product.specs
          .processor
      : "",
  ]
    .filter(
      (
        value,
      ) =>
        typeof value ===
        "string",
    )
    .join(" ")
    .toLowerCase()
    .replace(
      /[®™]/g,
      "",
    )
    .replace(
      /\s+/g,
      " ",
    )
    .trim();
}

// ======================================================
// Intent Normalization
// ======================================================

function normalizeIntent(
  intent:
    | IntentType[]
    | WeightedIntent[],
): WeightedIntent[] {
  if (
    !Array.isArray(
      intent,
    ) ||
    intent.length === 0
  ) {
    return [
      {
        type: "balanced",
        weight: 1,
      },
    ];
  }

  if (
    typeof intent[0] ===
    "string"
  ) {
    const unique =
      [
        ...new Set(
          (
            intent as IntentType[]
          ).filter(
            isIntentType,
          ),
        ),
      ];

    if (
      unique.length ===
      0
    ) {
      return [
        {
          type: "balanced",
          weight: 1,
        },
      ];
    }

    const weight =
      1 /
      unique.length;

    return unique.map(
      (
        type,
      ) => ({
        type,
        weight,
      }),
    );
  }

  const merged =
    new Map<
      IntentType,
      number
    >();

  for (
    const item of
      intent as WeightedIntent[]
  ) {
    if (
      !item ||
      !isIntentType(
        item.type,
      ) ||
      !Number.isFinite(
        item.weight,
      ) ||
      item.weight <= 0
    ) {
      continue;
    }

    merged.set(
      item.type,
      (
        merged.get(
          item.type,
        ) ?? 0
      ) +
        item.weight,
    );
  }

  const total =
    [
      ...merged.values(),
    ].reduce(
      (
        sum,
        value,
      ) =>
        sum + value,
      0,
    );

  if (
    total <= 0
  ) {
    return [
      {
        type: "balanced",
        weight: 1,
      },
    ];
  }

  return [
    ...merged.entries(),
  ].map(
    ([
      type,
      weight,
    ]) => ({
      type,
      weight:
        weight /
        total,
    }),
  );
}

// ======================================================
// Intent Type Guard
// ======================================================

function isIntentType(
  value: unknown,
): value is IntentType {
  return (
    value ===
      "gaming" ||
    value ===
      "camera" ||
    value ===
      "battery" ||
    value ===
      "balanced"
  );
}

// ======================================================
// Tags
// ======================================================

function normalizeTags(
  values: unknown,
): string[] {
  if (
    !Array.isArray(
      values,
    )
  ) {
    return [];
  }

  return [
    ...new Set(
      values
        .filter(
          (
            value,
          ): value is string =>
            typeof value ===
            "string",
        )
        .map(
          normalizeText,
        )
        .filter(Boolean),
    ),
  ];
}

// ======================================================
// Text Normalization
// ======================================================

function normalizeText(
  value: unknown,
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
      " ",
    );
}

// ======================================================
// Safe Number
// ======================================================

function safeNumber(
  value: unknown,
): number {
  if (
    typeof value ===
    "number"
  ) {
    return Number.isFinite(
      value,
    )
      ? value
      : 0;
  }

  if (
    typeof value !==
    "string"
  ) {
    return 0;
  }

  const normalized =
    value
      .trim()
      .replace(
        /,/g,
        "",
      );

  if (
    !normalized
  ) {
    return 0;
  }

  const direct =
    Number(
      normalized,
    );

  if (
    Number.isFinite(
      direct,
    )
  ) {
    return direct;
  }

  const match =
    normalized.match(
      /[-+]?\d+(?:\.\d+)?/,
    );

  if (
    !match?.[0]
  ) {
    return 0;
  }

  const parsed =
    Number(
      match[0],
    );

  return Number.isFinite(
    parsed,
  )
    ? parsed
    : 0;
}

// ======================================================
// Percentage
// ======================================================

function toPercentage(
  value: number,
): number {
  return Math.round(
    clamp(
      value,
      0,
      1,
    ) * 100,
  );
}

// ======================================================
// Clamp
// ======================================================

function clamp(
  value: number,
  min: number,
  max: number,
): number {
  if (
    !Number.isFinite(
      value,
    )
  ) {
    return min;
  }

  return Math.min(
    max,
    Math.max(
      min,
      value,
    ),
  );
}