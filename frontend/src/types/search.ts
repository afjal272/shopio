// ======================================================
// Parsed Search Intent
// ======================================================

export type Parsed = {
  intent: string[];

  budget: number | null;

  category?: string | null;

  constraints?: {
    minRam?: number;
    minBattery?: number;
    minRating?: number;
  };
};

// ======================================================
// Decision Breakdown
// ======================================================

/**
 * Normalized decision-engine scores.
 *
 * These values are for ranking/debugging and must NOT be
 * displayed as the product's physical specifications.
 *
 * Example:
 *   ram: 50
 *
 * means the ranking engine assigned a 50/100 RAM score.
 * It does NOT mean the product has "50% RAM".
 */
export type Breakdown = {
  ram?: number;
  processor?: number;
  battery?: number;
  rating?: number;

  trust?: number;
  value?: number;
  priceFit?: number;
  constraints?: number;
  tieBreaker?: number;
  total?: number;
};

// ======================================================
// Product Specifications
// ======================================================

/**
 * Canonical product specifications coming from the backend
 * normalization layer.
 *
 * These are actual product values, not decision-engine scores.
 */
export type Specs = {
  // ----------------------------------------------------
  // Memory
  // ----------------------------------------------------

  ram?: number;
  ramType?: string;

  // ----------------------------------------------------
  // Storage
  // ----------------------------------------------------

  /**
   * Storage is normalized to GB.
   *
   * Examples:
   *   128GB -> 128
   *   256GB -> 256
   *   1TB   -> 1024
   */
  storage?: number;
  storageType?: string;

  // ----------------------------------------------------
  // Battery
  // ----------------------------------------------------

  battery?: number;

  // ----------------------------------------------------
  // Processor
  // ----------------------------------------------------

  processor?: string;
  chipset?: string;
  processorType?: string;
  processorCores?: number;
  processorClockGHz?: number;

  /**
   * Legacy/derived field.
   *
   * Kept only for backward compatibility with old API
   * responses. UI should NOT use this as the product's
   * processor specification.
   */
  processorScore?: number;

  // ----------------------------------------------------
  // Camera
  // ----------------------------------------------------

  cameraMp?: number;
  frontCameraMp?: number;

  // ----------------------------------------------------
  // Display
  // ----------------------------------------------------

  displaySize?: number;
  refreshRate?: number;
  displayResolution?: string;

  // ----------------------------------------------------
  // Charging
  // ----------------------------------------------------

  chargingSpeed?: number;
  fastCharging?: boolean;

  // ----------------------------------------------------
  // Operating System
  // ----------------------------------------------------

  operatingSystem?: string;

  // ----------------------------------------------------
  // Network / SIM
  // ----------------------------------------------------

  network5g?: boolean;
  network4g?: boolean;
  simType?: string;

  // ----------------------------------------------------
  // Protection / Features
  // ----------------------------------------------------

  ipRating?: string;
  waterproof?: boolean;
  fingerprint?: boolean;
  wirelessCharging?: boolean;
  expandableStorage?: boolean;
  ois?: boolean;
  eis?: boolean;
  nfc?: boolean;
  stereoSpeakers?: boolean;
};

// ======================================================
// Product Search Result
// ======================================================

export type ProductItem = {
  id: string;

  name: string;

  brand?: string;

  category?: string;

  description?: string;

  price: number;

  images?: string[];

  score: number;

  confidence?: number;

  explanation?: string;

  tags?: string[];

  highlights?: string[];

  weaknesses?: string[];

  /**
   * Ranking/debugging scores.
   */
  breakdown?: Breakdown;

  /**
   * Actual normalized product specifications.
   */
  specs?: Specs;

  rating?: number;

  reviewsCount?: number;
};

// ======================================================
// Not Recommended
// ======================================================

export type NotRecommendedItem = {
  id: string;
  name: string;
  reason: string;
};

// ======================================================
// Suggestions
// ======================================================

export type SuggestionItem = {
  id: string;

  category: string;

  priority: string;

  title: string;

  description: string;

  confidence: number;

  impactScore: number;

  action?: string;
};

// ======================================================
// Search Response
// ======================================================

export type SearchResponse = {
  best: ProductItem | null;

  recommendations: ProductItem[];

  notRecommended: NotRecommendedItem[];

  comparison: string[];

  parsed: Parsed;

  suggestions: SuggestionItem[];

  isRelaxed: boolean;
};

// ======================================================
// Product Alias
// ======================================================

export type Product = ProductItem;