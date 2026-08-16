import {
  Constraints,
  ParsedQuery,
  IntentType,
  WeightedIntent,
} from "../types";

const INTENT_KEYWORDS: Record<
  Exclude<IntentType, "balanced">,
  readonly string[]
> = {
  gaming: [
    "gaming",
    "game",
    "pubg",
    "bgmi",
    "fps",
    "heavy gaming",
    "performance gaming",
  ],
  camera: [
    "camera",
    "photo",
    "photography",
    "video",
    "selfie",
    "portrait",
  ],
  battery: [
    "battery",
    "backup",
    "long lasting",
    "long-lasting",
    "power",
    "long battery",
    "battery life",
  ],
};

const NEGATIVE_INTENT_PATTERNS: readonly RegExp[] = [
  /\bnot\s+(?:for\s+)?(gaming|camera|battery)\b/i,
  /\bno\s+(gaming|camera|battery)\b/i,
  /\bavoid\s+(gaming|camera|battery)\b/i,
  /\bwithout\s+(gaming|camera|battery)\b/i,
  /\b(?:don't|do not)\s+(?:need|want)\s+(?:gaming|camera|battery)\b/i,
];

export function parseQuery(query: string): ParsedQuery {
  const originalQuery = typeof query === "string" ? query.trim() : "";
  const q = normalizeQuery(originalQuery);

  const budget = parseBudget(q);
  const category = parseCategory(q);

  const detectedIntent = detectIntents(q);
  const negativeIntent = detectNegativeIntents(q);

  const filteredIntent = detectedIntent.filter(
    (intent) => !negativeIntent.includes(intent)
  );

  const finalIntent: IntentType[] =
    filteredIntent.length > 0
      ? filteredIntent
      : ["balanced"];

  const weightedIntent = buildWeightedIntent(
    q,
    finalIntent,
    negativeIntent
  );

  const constraints = parseConstraints(q, budget);

  return {
    originalQuery,
    category,
    budget,
    intent: finalIntent,
    weightedIntent,
    negativeIntent,
    constraints:
      Object.keys(constraints).length > 0
        ? constraints
        : undefined,
  };
}

function normalizeQuery(
  query: string
): string {
  return query
    .toLowerCase()
    .replace(/₹/g, " ₹ ")
    .replace(/\s+/g, " ")
    .trim();
}

function parseBudget(
  query: string
): number | null {
  if (!query) {
    return null;
  }

  const normalized = query
    .replace(/₹/g, " ₹ ")
    .replace(/,/g, "")
    .replace(/\s+/g, " ")
    .trim();

  const lakhMatch = normalized.match(
    /\b(?:under|below|within|max(?:imum)?(?:\s+budget)?|upto|up\s+to|around|for)?\s*₹?\s*(\d+(?:\.\d+)?)\s*(?:lakh|lac|lakhs|lacs)\b/i
  );

  if (lakhMatch?.[1]) {
    const value = Number(lakhMatch[1]);

    if (Number.isFinite(value) && value > 0) {
      return Math.round(value * 100000);
    }
  }

  const croreMatch = normalized.match(
    /\b(?:under|below|within|max(?:imum)?(?:\s+budget)?|upto|up\s+to|around|for)?\s*₹?\s*(\d+(?:\.\d+)?)\s*(?:crore|crores|cr)\b/i
  );

  if (croreMatch?.[1]) {
    const value = Number(croreMatch[1]);

    if (Number.isFinite(value) && value > 0) {
      return Math.round(value * 10000000);
    }
  }

  const thousandMatch = normalized.match(
    /\b(?:under|below|within|max(?:imum)?(?:\s+budget)?|upto|up\s+to|around|for)?\s*₹?\s*(\d+(?:\.\d+)?)\s*(?:k|thousand)\b/i
  );

  if (thousandMatch?.[1]) {
    const value = Number(thousandMatch[1]);

    if (Number.isFinite(value) && value > 0) {
      return Math.round(value * 1000);
    }
  }

  const rupeeAmountMatch = normalized.match(
    /₹\s*(\d+(?:\.\d+)?)/i
  );

  if (rupeeAmountMatch?.[1]) {
    const value = Number(rupeeAmountMatch[1]);

    if (Number.isFinite(value) && value > 0) {
      return Math.round(value);
    }
  }

  const contextualAmountMatch = normalized.match(
    /\b(?:under|below|within|max(?:imum)?(?:\s+budget)?|upto|up\s+to|around)\s+(?:₹\s*)?(\d+(?:\.\d+)?)\b/i
  );

  if (contextualAmountMatch?.[1]) {
    const value = Number(contextualAmountMatch[1]);

    if (Number.isFinite(value) && value > 0) {
      return Math.round(value);
    }
  }

  const standaloneKMatch = normalized.match(
    /\b₹?\s*(\d+(?:\.\d+)?)\s*k\b/i
  );

  if (standaloneKMatch?.[1]) {
    const value = Number(standaloneKMatch[1]);

    if (Number.isFinite(value) && value > 0) {
      return Math.round(value * 1000);
    }
  }

  const standaloneAmountMatch = normalized.match(
    /₹\s*(\d{4,7})\b/i
  );

  if (standaloneAmountMatch?.[1]) {
    const value = Number(standaloneAmountMatch[1]);

    if (Number.isFinite(value) && value > 0) {
      return Math.round(value);
    }
  }

  return null;
}

function parseCategory(
  query: string
): ParsedQuery["category"] {
  if (
    /\b(phone|mobile|smartphone|iphone|android)\b/i.test(
      query
    )
  ) {
    return "smartphone";
  }

  if (
    /\b(laptop|notebook|macbook)\b/i.test(
      query
    )
  ) {
    return "laptop";
  }

  return "general";
}

function detectIntents(
  query: string
): IntentType[] {
  const detected: IntentType[] = [];

  for (const [intent, keywords] of Object.entries(
    INTENT_KEYWORDS
  ) as [
    Exclude<IntentType, "balanced">,
    readonly string[]
  ][]) {
    if (
      keywords.some((keyword) =>
        matchesKeyword(query, keyword)
      )
    ) {
      detected.push(intent);
    }
  }

  return [...new Set(detected)];
}

function detectNegativeIntents(
  query: string
): IntentType[] {
  const negative: IntentType[] = [];

  for (const pattern of NEGATIVE_INTENT_PATTERNS) {
    const match = query.match(pattern);

    if (!match?.[1]) {
      continue;
    }

    const value = match[1].toLowerCase();

    if (
      value === "gaming" ||
      value === "camera" ||
      value === "battery"
    ) {
      negative.push(value);
    }
  }

  return [...new Set(negative)];
}

function buildWeightedIntent(
  query: string,
  intents: IntentType[],
  negativeIntent: IntentType[]
): WeightedIntent[] {
  const validIntents = intents.filter(
    (intent) => !negativeIntent.includes(intent)
  );

  if (validIntents.length === 0) {
    return [
      {
        type: "balanced",
        weight: 1,
      },
    ];
  }

  const rawWeights = new Map<
    IntentType,
    number
  >();

  for (const intent of validIntents) {
    const keywords =
      intent === "balanced"
        ? []
        : INTENT_KEYWORDS[
            intent as Exclude<
              IntentType,
              "balanced"
            >
          ];

    let weight = 0;

    for (const keyword of keywords) {
      const matches = countKeywordMatches(
        query,
        keyword
      );

      weight += matches;
    }

    if (weight > 0) {
      rawWeights.set(intent, weight);
    }
  }

  if (rawWeights.size === 0) {
    const weight =
      1 / validIntents.length;

    return validIntents.map((type) => ({
      type,
      weight,
    }));
  }

  const totalWeight = [
    ...rawWeights.values(),
  ].reduce(
    (total, value) => total + value,
    0
  );

  if (totalWeight <= 0) {
    return [
      {
        type: "balanced",
        weight: 1,
      },
    ];
  }

  return [...rawWeights.entries()].map(
    ([type, weight]) => ({
      type,
      weight: weight / totalWeight,
    })
  );
}

function parseConstraints(
  query: string,
  budget: number | null
): Constraints {
  const constraints: Constraints = {};

  const ramMatch = query.match(
    /\b(?:at\s+least|minimum|min)?\s*(\d+(?:\.\d+)?)\s*gb\s*(?:ram|memory)\b/i
  );

  if (ramMatch?.[1]) {
    const value = Number(ramMatch[1]);

    if (
      Number.isFinite(value) &&
      value > 0
    ) {
      constraints.minRam = value;
    }
  }

  const batteryMatch = query.match(
    /\b(?:at\s+least|minimum|min)?\s*(\d{4,6})\s*mah\b/i
  );

  if (batteryMatch?.[1]) {
    const value = Number(
      batteryMatch[1]
    );

    if (
      Number.isFinite(value) &&
      value > 0
    ) {
      constraints.minBattery = value;
    }
  }

  const ratingMatch = query.match(
    /\b(?:at\s+least|minimum|min)?\s*(\d+(?:\.\d+)?)\s*(?:rating|stars?|star)\b/i
  );

  if (ratingMatch?.[1]) {
    const value = Number(
      ratingMatch[1]
    );

    if (
      Number.isFinite(value) &&
      value >= 0 &&
      value <= 5
    ) {
      constraints.minRating = value;
    }
  }

  if (budget !== null) {
    constraints.maxPrice = budget;
  }

  const maxRamMatch = query.match(
    /\b(?:under|below|max(?:imum)?|up\s+to)\s*(\d+(?:\.\d+)?)\s*gb\s*(?:ram|memory)\b/i
  );

  if (maxRamMatch?.[1]) {
    const value = Number(
      maxRamMatch[1]
    );

    if (
      Number.isFinite(value) &&
      value > 0
    ) {
      constraints.maxRam = value;
      delete constraints.minRam;
    }
  }

  const maxBatteryMatch = query.match(
    /\b(?:under|below|max(?:imum)?|up\s+to)\s*(\d{4,6})\s*mah\b/i
  );

  if (maxBatteryMatch?.[1]) {
    const value = Number(
      maxBatteryMatch[1]
    );

    if (
      Number.isFinite(value) &&
      value > 0
    ) {
      constraints.maxBattery = value;
      delete constraints.minBattery;
    }
  }

  const preferredBrandMatch = query.match(
    /\b(?:prefer|preferred|want|with)\s+(?:brand\s+)?([a-z0-9]+)\b/i
  );

  if (preferredBrandMatch?.[1]) {
    constraints.preferredBrands = [
      preferredBrandMatch[1].trim().toLowerCase(),
    ];
  }

  return constraints;
}

function matchesKeyword(
  query: string,
  keyword: string
): boolean {
  const normalizedKeyword =
    keyword.trim().toLowerCase();

  if (!normalizedKeyword) {
    return false;
  }

  if (
    normalizedKeyword.includes(" ")
  ) {
    return query.includes(
      normalizedKeyword
    );
  }

  const regex = new RegExp(
    `\\b${escapeRegExp(normalizedKeyword)}\\b`,
    "i"
  );

  return regex.test(query);
}

function countKeywordMatches(
  query: string,
  keyword: string
): number {
  const normalizedKeyword =
    keyword.trim().toLowerCase();

  if (!normalizedKeyword) {
    return 0;
  }

  if (
    normalizedKeyword.includes(" ")
  ) {
    let count = 0;
    let start = 0;

    while (true) {
      const index = query.indexOf(
        normalizedKeyword,
        start
      );

      if (index === -1) {
        break;
      }

      count++;
      start =
        index +
        normalizedKeyword.length;
    }

    return count;
  }

  const regex = new RegExp(
    `\\b${escapeRegExp(normalizedKeyword)}\\b`,
    "gi"
  );

  return query.match(regex)?.length ?? 0;
}

function escapeRegExp(
  value: string
): string {
  return value.replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&"
  );
}