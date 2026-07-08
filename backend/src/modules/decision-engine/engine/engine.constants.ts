// ======================================================
// Decision Engine
// ======================================================

export const ENGINE = {
  VERSION: "1.0.0",

  DEFAULT_INTENT: "balanced",

} as const;

// ======================================================
// Candidate Selection
// ======================================================

export const CANDIDATE = {
  MIN_RESULTS: 3,

  MAX_TOP_PICKS: 8,

  MAX_REJECTED_PRODUCTS: 3,
} as const;

// ======================================================
// Fallback
// ======================================================

export const FALLBACK = {
  MAX_RELAXED_RESULTS: 5,

  PRICE_RELAXATION_PERCENT: 0.1,

  MAX_RELAXATION_LEVEL: 2,
} as const;

// ======================================================
// Confidence
// ======================================================

export const CONFIDENCE = {
  MIN: 0,

  MAX: 100,

  DEFAULT: 50,

  HIGH_THRESHOLD: 85,

  MEDIUM_THRESHOLD: 70,

  LOW_THRESHOLD: 50,

  ROUND_DECIMALS: 2,
} as const;

// ======================================================
// Score
// ======================================================

export const SCORE = {
  MIN: 0,

  MAX: 100,

  DEFAULT: 0,

  MIN_RECOMMENDATION: 60,

  MAX_ADJUSTMENT: 0.25,

  CORE_WEIGHT: 0.8,

  CURVE_EXPONENT: 1.4,
} as const;

// ======================================================
// Product Defaults
// ======================================================

export const PRODUCT = {
  DEFAULT_NAME: "Unknown Product",

  DEFAULT_PRICE: 0,

  DEFAULT_RATING: 0,

  DEFAULT_REVIEWS: 0,

  DEFAULT_IMAGES: [] as string[],

  DEFAULT_TAGS: [] as string[],

  DEFAULT_HIGHLIGHTS: [] as string[],

  DEFAULT_WEAKNESSES: [] as string[],
} as const;

// ======================================================
// Suggestions
// ======================================================

export const SUGGESTION = {
  MAX_RESULTS: 6,

  MIN_CONFIDENCE: 0.6,
} as const;

// ======================================================
// Explanation
// ======================================================

export const EXPLANATION = {
  MAX_REASONS: 4,

  MAX_HIGHLIGHTS: 3,

  MAX_WEAKNESSES: 3,
} as const;

// ======================================================
// Comparison
// ======================================================

export const COMPARISON = {
  TOP_PRODUCTS: 4,

  MAX_REASONS: 4,

  MAX_WEAKNESSES: 4,

  MAX_STRENGTHS: 4,
} as const;

// ======================================================
// AI Decision Engine
// ======================================================

export const AI = {
  MIN_RECOMMENDATION_SCORE: 60,

  HIGH_CONFIDENCE_THRESHOLD: 85,

  MEDIUM_CONFIDENCE_THRESHOLD: 70,

  LOW_CONFIDENCE_THRESHOLD: 50,
} as const;