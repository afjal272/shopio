import {
  AmazonProductSearchParams,
  AmazonProductSearchResponse,
  AmazonSearchResult,
  NormalizedAmazonProduct,
} from "./amazon.types";

import { amazonClient } from "./amazon.client";

import { mapAmazonProduct } from "./amazon.mapper";

// ======================================================
// Constants
// ======================================================

const DEFAULT_PAGE = 1;

const DEFAULT_COUNTRY = "IN";

// ======================================================
// Amazon Service
// ======================================================

export class AmazonService {
  // ====================================================
  // Search Products
  // ====================================================

  async searchProducts(
    params: AmazonProductSearchParams
  ): Promise<AmazonSearchResult> {
    const query = normalizeQuery(
      params.query
    );

    if (!query) {
      throw new Error(
        "Amazon product search query is required"
      );
    }

    const page =
      params.page ?? DEFAULT_PAGE;

    validatePage(page);

    const country =
      normalizeCountry(
        params.country
      );

    const response =
      await amazonClient.searchProducts({
        ...params,
        query,
        country,
        page,
      });

    return this.normalizeSearchResponse(
      response,
      page
    );
  }

  // ====================================================
  // Normalize Search Response
  // ====================================================

  private normalizeSearchResponse(
    response: AmazonProductSearchResponse,
    page: number
  ): AmazonSearchResult {
    if (!isRecord(response)) {
      throw new Error(
        "Invalid Amazon API response"
      );
    }

    const data =
      response.data;

    if (!isRecord(data)) {
      throw new Error(
        "Invalid Amazon API response: missing data"
      );
    }

    const rawProducts =
      data.products;

    if (!Array.isArray(rawProducts)) {
      throw new Error(
        "Invalid Amazon API response: missing products array"
      );
    }

    const products =
      rawProducts
        .map(
          (
            product
          ): NormalizedAmazonProduct | null =>
            mapAmazonProduct(product)
        )
        .filter(
          (
            product
          ): product is NormalizedAmazonProduct =>
            product !== null
        );

    const totalResults =
      parseNonNegativeInteger(
        data.total_products
      );

    /*
     * Amazon's response does not expose a guaranteed
     * page-size field in our normalized contract.
     *
     * Therefore we use the number of raw results returned
     * for the current page. This avoids incorrectly using
     * the number of products that survived mapping.
     */
    const pageResultCount =
      rawProducts.length;

    const hasNextPage =
      totalResults !== null &&
      pageResultCount > 0
        ? page * pageResultCount <
          totalResults
        : false;

    return {
      products,

      page,

      hasNextPage,

      ...(totalResults !== null
        ? {
            totalResults,
          }
        : {}),
    };
  }
}

// ======================================================
// Query Normalization
// ======================================================

function normalizeQuery(
  value: string
): string {
  if (
    typeof value !== "string"
  ) {
    return "";
  }

  return value
    .trim()
    .replace(/\s+/g, " ");
}

// ======================================================
// Country Normalization
// ======================================================

function normalizeCountry(
  value?: string
): string {
  const country =
    value?.trim() ||
    DEFAULT_COUNTRY;

  return country.toUpperCase();
}

// ======================================================
// Page Validation
// ======================================================

function validatePage(
  page: number
): void {
  if (
    !Number.isInteger(page) ||
    page < 1
  ) {
    throw new Error(
      "Amazon product search page must be a positive integer"
    );
  }
}

// ======================================================
// Runtime Object Validation
// ======================================================

function isRecord(
  value: unknown
): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

// ======================================================
// Number Normalization
// ======================================================

function parseNonNegativeInteger(
  value: unknown
): number | null {
  if (
    typeof value === "number" &&
    Number.isFinite(value)
  ) {
    return Math.max(
      0,
      Math.round(value)
    );
  }

  if (
    typeof value !== "string"
  ) {
    return null;
  }

  const normalized =
    value
      .replace(/,/g, "")
      .trim();

  if (!normalized) {
    return null;
  }

  const parsed =
    Number(normalized);

  if (
    !Number.isFinite(parsed)
  ) {
    return null;
  }

  return Math.max(
    0,
    Math.round(parsed)
  );
}

// ======================================================
// Singleton
// ======================================================

export const amazonService =
  new AmazonService();