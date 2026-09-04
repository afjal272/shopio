import { Prisma } from "@prisma/client";

import {
  AmazonProductSearchParams,
  NormalizedAmazonProduct,
} from "../integrations/amazon/amazon.types";

import { amazonService } from "../integrations/amazon/amazon.service";

import { UpsertMarketplaceProductInput } from "../repositories/product.repository";

import { productService } from "./product.service";

// ======================================================
// Constants
// ======================================================

const AMAZON_MARKETPLACE = "AMAZON" as const;

const DEFAULT_CATEGORY = "smartphone";

const DEFAULT_DESCRIPTION =
  "Product information provided by Amazon.";

const DEFAULT_CURRENCY = "INR";

// ======================================================
// Sync Result
// ======================================================

export interface ProductSyncResult {
  marketplace: "AMAZON" | "FLIPKART";

  requested: number;

  processed: number;

  succeeded: number;

  failed: number;

  skipped: number;

  hasNextPage: boolean;

  errors: ProductSyncError[];
}

// ======================================================
// Sync Error
// ======================================================

export interface ProductSyncError {
  externalId: string;

  message: string;
}

// ======================================================
// Product Sync Service
// ======================================================

export class ProductSyncService {
  // ====================================================
  // Sync Amazon Products
  // ====================================================

  async syncAmazonProducts(
    params: AmazonProductSearchParams,
  ): Promise<ProductSyncResult> {
    const result = await amazonService.searchProducts(params);

    const syncResult = this.createSyncResult(
      result.products.length,
      result.hasNextPage,
    );

    for (const product of result.products) {
      try {
        const input =
          this.mapAmazonProductToSyncInput(product);

        if (!input) {
          syncResult.skipped += 1;
          syncResult.processed += 1;

          continue;
        }

        await productService.syncMarketplaceProduct(
          input,
        );

        syncResult.succeeded += 1;
      } catch (error: unknown) {
        syncResult.failed += 1;

        syncResult.errors.push({
          externalId: product.externalId,
          message: getErrorMessage(error),
        });
      }

      syncResult.processed += 1;
    }

    return syncResult;
  }

  // ====================================================
  // Map Amazon Product
  // ====================================================

  private mapAmazonProductToSyncInput(
    product: NormalizedAmazonProduct,
  ): UpsertMarketplaceProductInput | null {
    // ==================================================
    // Required Fields
    // ==================================================

    const externalId =
      normalizeRequiredString(
        product.externalId,
      );

    const name =
      normalizeRequiredString(
        product.name,
      );

    const brand =
      normalizeRequiredString(
        product.brand,
      );

    const productUrl =
      normalizeRequiredString(
        product.productUrl,
      );

    if (
      !externalId ||
      !name ||
      !brand ||
      !productUrl
    ) {
      return null;
    }

    // ==================================================
    // Price
    // ==================================================

    if (
      !Number.isFinite(product.price) ||
      product.price <= 0
    ) {
      return null;
    }

    const price = Math.round(
      product.price,
    );

    // ==================================================
    // Canonical Key
    // ==================================================

    const canonicalKey =
      buildCanonicalKey(
        brand,
        name,
      );

    if (!canonicalKey) {
      return null;
    }

    // ==================================================
    // Image
    // ==================================================

    const imageUrl =
      normalizeOptionalString(
        product.imageUrl,
      );

    const images = imageUrl
      ? [imageUrl]
      : [];

    // ==================================================
    // Description
    //
    // Preserve the normalized Amazon description.
    // Only use the fallback when Amazon did not provide
    // a usable description.
    // ==================================================

    const description =
      normalizeOptionalString(
        product.description,
      ) ??
      DEFAULT_DESCRIPTION;

    // ==================================================
    // Category
    //
    // Preserve the normalized category instead of
    // blindly replacing every product category with
    // "smartphone".
    // ==================================================

    const category =
      normalizeOptionalString(
        product.category,
      ) ??
      DEFAULT_CATEGORY;

    // ==================================================
    // Currency
    // ==================================================

    const currency =
      normalizeOptionalString(
        product.currency,
      ) ??
      DEFAULT_CURRENCY;

    // ==================================================
    // Final Sync Input
    // ==================================================

    return {
      marketplace:
        AMAZON_MARKETPLACE,

      externalId,

      name,

      brand,

      category,

      description,

      price,

      originalPrice:
        normalizeOptionalPrice(
          product.originalPrice,
        ),

      currency,

      productUrl,

      imageUrl,

      availability:
        normalizeOptionalString(
          product.availability,
        ),

      rating:
        normalizeOptionalRating(
          product.rating,
        ),

      reviewsCount:
        normalizeOptionalInteger(
          product.reviewsCount,
        ),

      images,

      tags:
        normalizeStringArray(
          product.tags,
        ),

      highlights:
        normalizeStringArray(
          product.highlights,
        ),

      weaknesses:
        normalizeStringArray(
          product.weaknesses,
        ),

      specs:
        normalizeSpecs(
          product.specs,
        ),

      canonicalKey,
    };
  }

  // ====================================================
  // Initial Result
  // ====================================================

  private createSyncResult(
    requested: number,
    hasNextPage: boolean,
  ): ProductSyncResult {
    return {
      marketplace:
        AMAZON_MARKETPLACE,

      requested,

      processed: 0,

      succeeded: 0,

      failed: 0,

      skipped: 0,

      hasNextPage,

      errors: [],
    };
  }
}

// ======================================================
// Canonical Key
// ======================================================

function buildCanonicalKey(
  brand: string,
  name: string,
): string {
  return `${brand}-${name}`
    .toLowerCase()
    .normalize("NFKD")
    .replace(
      /[\u0300-\u036f]/g,
      "",
    )
    .replace(
      /[^a-z0-9]+/g,
      "-",
    )
    .replace(
      /^-+|-+$/g,
      "");
}

// ======================================================
// String Normalization
// ======================================================

function normalizeRequiredString(
  value: string | undefined,
): string | null {
  if (value === undefined) {
    return null;
  }

  const normalized =
    value
      .trim()
      .replace(
        /\s+/g,
        " ",
      );

  return normalized.length > 0
    ? normalized
    : null;
}

function normalizeOptionalString(
  value?: string,
): string | undefined {
  if (value === undefined) {
    return undefined;
  }

  const normalized =
    value
      .trim()
      .replace(
        /\s+/g,
        " ",
      );

  return normalized.length > 0
    ? normalized
    : undefined;
}

// ======================================================
// Price Normalization
// ======================================================

function normalizeOptionalPrice(
  value?: number,
): number | undefined {
  if (
    value === undefined ||
    !Number.isFinite(value) ||
    value <= 0
  ) {
    return undefined;
  }

  return Math.round(value);
}

// ======================================================
// Rating Normalization
// ======================================================

function normalizeOptionalRating(
  value?: number,
): number | undefined {
  if (
    value === undefined ||
    !Number.isFinite(value)
  ) {
    return undefined;
  }

  return Math.min(
    5,
    Math.max(
      0,
      value,
    ),
  );
}

// ======================================================
// Integer Normalization
// ======================================================

function normalizeOptionalInteger(
  value?: number,
): number | undefined {
  if (
    value === undefined ||
    !Number.isFinite(value)
  ) {
    return undefined;
  }

  return Math.max(
    0,
    Math.round(value),
  );
}

// ======================================================
// Array Normalization
// ======================================================

function normalizeStringArray(
  values: string[],
): string[] {
  return [
    ...new Set(
      values
        .map(
          (value) =>
            value
              .trim()
              .replace(
                /\s+/g,
                " ",
              ),
        )
        .filter(Boolean),
    ),
  ];
}

// ======================================================
// Specs Normalization
// ======================================================

function normalizeSpecs(
  specs: Record<string, unknown>,
): Prisma.InputJsonObject {
  const normalized: Record<
    string,
    Prisma.InputJsonValue
  > = {};

  for (const [
    key,
    value,
  ] of Object.entries(specs)) {
    const normalizedKey =
      key.trim();

    if (!normalizedKey) {
      continue;
    }

    const normalizedValue =
      normalizeJsonValue(
        value,
      );

    if (
      normalizedValue ===
      undefined
    ) {
      continue;
    }

    normalized[
      normalizedKey
    ] = normalizedValue;
  }

  return normalized as Prisma.InputJsonObject;
}

// ======================================================
// JSON Value Normalization
// ======================================================

function normalizeJsonValue(
  value: unknown,
): Prisma.InputJsonValue | undefined {
  // ----------------------------------------------------
  // Null
  // ----------------------------------------------------

  if (value === null) {
    return undefined;
  }

  // ----------------------------------------------------
  // Primitive Values
  // ----------------------------------------------------

  if (
    typeof value ===
    "string"
  ) {
    return value;
  }

  if (
    typeof value ===
    "boolean"
  ) {
    return value;
  }

  if (
    typeof value ===
    "number"
  ) {
    return Number.isFinite(
      value,
    )
      ? value
      : undefined;
  }

  // ----------------------------------------------------
  // Arrays
  // ----------------------------------------------------

  if (
    Array.isArray(value)
  ) {
    const normalized:
      Prisma.InputJsonValue[] =
      [];

    for (
      const item of value
    ) {
      const normalizedItem =
        normalizeJsonValue(
          item,
        );

      if (
        normalizedItem ===
        undefined
      ) {
        continue;
      }

      normalized.push(
        normalizedItem,
      );
    }

    return normalized as Prisma.InputJsonArray;
  }

  // ----------------------------------------------------
  // Objects
  // ----------------------------------------------------

  if (
    isPlainObject(value)
  ) {
    const normalized: Record<
      string,
      Prisma.InputJsonValue
    > = {};

    for (const [
      key,
      nestedValue,
    ] of Object.entries(
      value,
    )) {
      const normalizedKey =
        key.trim();

      if (!normalizedKey) {
        continue;
      }

      const normalizedNestedValue =
        normalizeJsonValue(
          nestedValue,
        );

      if (
        normalizedNestedValue ===
        undefined
      ) {
        continue;
      }

      normalized[
        normalizedKey
      ] =
        normalizedNestedValue;
    }

    return normalized as Prisma.InputJsonObject;
  }

  return undefined;
}

// ======================================================
// Plain Object Check
// ======================================================

function isPlainObject(
  value: unknown,
): value is Record<
  string,
  unknown
> {
  return (
    typeof value ===
      "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

// ======================================================
// Error Handling
// ======================================================

function getErrorMessage(
  error: unknown,
): string {
  if (
    error instanceof Error
  ) {
    return error.message;
  }

  if (
    typeof error ===
    "string"
  ) {
    return error;
  }

  return "Unknown synchronization error";
}

// ======================================================
// Singleton
// ======================================================

export const productSyncService =
  new ProductSyncService();