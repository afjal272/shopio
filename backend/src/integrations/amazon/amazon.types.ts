// ======================================================
// Amazon Integration Types
// ======================================================

/**
 * JSON-compatible primitive values returned by external APIs.
 */
export type JsonPrimitive =
  | string
  | number
  | boolean
  | null;

/**
 * JSON-compatible value.
 */
export type JsonValue =
  | JsonPrimitive
  | JsonValue[]
  | {
      [key: string]: JsonValue;
    };

// ======================================================
// Amazon API Configuration
// ======================================================

export interface AmazonApiConfig {
  apiKey: string;
  apiHost: string;
  baseUrl: string;
  country: string;
  timeoutMs: number;
}

// ======================================================
// Product Search Request
// ======================================================

export interface AmazonProductSearchParams {
  query: string;
  country?: string;
  page?: number;
  category?: string;
}

// ======================================================
// Raw Amazon API Response
// ======================================================

/**
 * External API responses are intentionally kept unknown
 * until the response passes runtime validation.
 *
 * Do not replace unknown with any.
 */
export type AmazonProductSearchResponse = unknown;

// ======================================================
// Raw Amazon Product
// ======================================================

export type AmazonProduct = unknown;

// ======================================================
// Normalized Amazon Product
// ======================================================

/**
 * Internal representation used by the catalog sync layer.
 *
 * This type is independent of RapidAPI's response structure.
 */
export interface NormalizedAmazonProduct {
  externalId: string;

  name: string;

  brand: string;

  price: number;

  originalPrice?: number;

  currency: string;

  productUrl: string;

  imageUrl?: string;

  rating?: number;

  reviewsCount?: number;

  availability?: string;

  description?: string;

  category: string;

  tags: string[];

  highlights: string[];

  weaknesses: string[];

  specs: Record<string, JsonValue>;
}

// ======================================================
// Amazon API Error
// ======================================================

export interface AmazonApiErrorResponse {
  message?: string;

  error?: string;

  status?: number;

  code?: string;

  details?: JsonValue;
}

// ======================================================
// Amazon Client Result
// ======================================================

export interface AmazonSearchResult {
  products: NormalizedAmazonProduct[];

  page: number;

  hasNextPage: boolean;

  totalResults?: number;
}