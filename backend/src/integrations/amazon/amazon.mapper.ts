import {
  JsonValue,
  NormalizedAmazonProduct,
} from "./amazon.types";

// ======================================================
// Raw Amazon Product
// ======================================================

interface RawAmazonProduct {
  asin?: unknown;
  product_title?: unknown;

  product_price?: unknown;
  product_original_price?: unknown;
  product_minimum_offer_price?: unknown;

  currency?: unknown;

  product_star_rating?: unknown;
  product_num_ratings?: unknown;

  product_url?: unknown;
  product_photo?: unknown;

  product_num_offers?: unknown;
  product_availability?: unknown;

  sales_volume?: unknown;
  delivery?: unknown;

  is_best_seller?: unknown;
  is_amazon_choice?: unknown;
  is_prime?: unknown;

  product_badge?: unknown;
  has_variations?: unknown;
}

// ======================================================
// Constants
// ======================================================

const DEFAULT_CURRENCY = "INR";

const DEFAULT_CATEGORY = "smartphone";

const MAX_HIGHLIGHTS = 8;

const KNOWN_BRANDS = [
  "OnePlus",
  "realme",
  "iQOO",
  "Nothing",
  "Motorola",
  "Samsung",
  "Nokia",
  "Lava",
  "Redmi",
  "Xiaomi",
  "POCO",
  "Poco",
  "Vivo",
  "OPPO",
  "Oppo",
  "Google",
  "Apple",
  "ASUS",
  "Lenovo",
  "Infinix",
  "Tecno",
  "Honor",
  "Huawei",
  "Sony",
  "Nubia",
  "ZTE",
];

// ======================================================
// Public Mapper
// ======================================================

export function mapAmazonProduct(
  input: unknown
): NormalizedAmazonProduct | null {
  if (!isRecord(input)) {
    return null;
  }

  const product =
    input as RawAmazonProduct;

  // ====================================================
  // Required Fields
  // ====================================================

  const externalId =
    readRequiredString(
      product.asin
    );

  const title =
    readRequiredString(
      product.product_title
    );

  const productUrl =
    readRequiredUrl(
      product.product_url
    );

  const price =
    parsePrice(
      product.product_price
    );

  /*
   * A product without ASIN, title, URL or valid price
   * cannot safely enter the product catalog.
   */
  if (
    !externalId ||
    !title ||
    !productUrl ||
    price === null ||
    price <= 0
  ) {
    return null;
  }

  // ====================================================
  // Optional Marketplace Data
  // ====================================================

  const imageUrl =
    readOptionalUrl(
      product.product_photo
    );

  const originalPrice =
    parsePrice(
      product.product_original_price
    );

  const minimumOfferPrice =
    parsePrice(
      product.product_minimum_offer_price
    );

  const rating =
    parseRating(
      product.product_star_rating
    );

  const reviewsCount =
    parseNonNegativeInteger(
      product.product_num_ratings
    );

  const availability =
    readOptionalString(
      product.product_availability
    );

  const currency =
    normalizeCurrency(
      product.currency
    );

  // ====================================================
  // Product Intelligence
  // ====================================================

  const name =
    decodeHtmlEntities(
      title
    );

  const brand =
    extractBrand(name);

  const category =
    detectCategory(name);

  const specs =
    extractSpecs(name);

  const tags =
    buildTags(
      name,
      specs
    );

  const highlights =
    buildHighlights(
      name,
      specs
    );

  // ====================================================
  // Final Normalized Product
  // ====================================================

  return {
    externalId,

    name,

    brand,

    price,

    ...(originalPrice !== null &&
    originalPrice > price
      ? {
          originalPrice,
        }
      : {}),

    /*
     * Keep the actual product price as the primary price.
     * The minimum offer price is marketplace metadata and
     * should not silently replace product_price.
     */
    ...(minimumOfferPrice !== null &&
    minimumOfferPrice > 0
      ? {
          minimumOfferPrice,
        }
      : {}),

    currency,

    productUrl,

    ...(imageUrl
      ? {
          imageUrl,
        }
      : {}),

    ...(rating !== null
      ? {
          rating,
        }
      : {}),

    ...(reviewsCount !== null
      ? {
          reviewsCount,
        }
      : {}),

    ...(availability
      ? {
          availability,
        }
      : {}),

    category,

    tags,

    highlights,

    weaknesses: [],

    specs,
  };
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
// String Helpers
// ======================================================

function readString(
  value: unknown
): string | null {
  if (
    typeof value !== "string"
  ) {
    return null;
  }

  const normalized =
    value
      .trim()
      .replace(/\s+/g, " ");

  return normalized
    ? normalized
    : null;
}

function readRequiredString(
  value: unknown
): string | null {
  return readString(value);
}

function readOptionalString(
  value: unknown
): string | undefined {
  const normalized =
    readString(value);

  return normalized ??
    undefined;
}

// ======================================================
// URL Helpers
// ======================================================

function readRequiredUrl(
  value: unknown
): string | null {
  const url =
    readString(value);

  if (!url) {
    return null;
  }

  return isValidHttpsUrl(url)
    ? url
    : null;
}

function readOptionalUrl(
  value: unknown
): string | undefined {
  const url =
    readString(value);

  if (!url) {
    return undefined;
  }

  return isValidHttpsUrl(url)
    ? url
    : undefined;
}

function isValidHttpsUrl(
  value: string
): boolean {
  try {
    const url =
      new URL(value);

    return (
      url.protocol === "https:"
    );
  } catch {
    return false;
  }
}

// ======================================================
// Currency
// ======================================================

function normalizeCurrency(
  value: unknown
): string {
  const currency =
    readString(value);

  if (!currency) {
    return DEFAULT_CURRENCY;
  }

  return currency
    .toUpperCase()
    .slice(0, 3);
}

// ======================================================
// Price Parsing
// ======================================================

function parsePrice(
  value: unknown
): number | null {
  if (
    typeof value === "number"
  ) {
    if (
      !Number.isFinite(value) ||
      value < 0
    ) {
      return null;
    }

    return Math.round(value);
  }

  if (
    typeof value !== "string"
  ) {
    return null;
  }

  const normalized =
    value
      .replace(/,/g, "")
      .replace(/[^\d.]/g, "")
      .trim();

  if (!normalized) {
    return null;
  }

  if (
    !/^\d+(?:\.\d+)?$/.test(
      normalized
    )
  ) {
    return null;
  }

  const parsed =
    Number(normalized);

  if (
    !Number.isFinite(parsed) ||
    parsed < 0
  ) {
    return null;
  }

  return Math.round(parsed);
}

// ======================================================
// Rating Parsing
// ======================================================

function parseRating(
  value: unknown
): number | null {
  let rating: number;

  if (
    typeof value === "number"
  ) {
    rating = value;
  } else if (
    typeof value === "string"
  ) {
    rating =
      Number(
        value.trim()
      );
  } else {
    return null;
  }

  if (
    !Number.isFinite(rating)
  ) {
    return null;
  }

  return Math.min(
    5,
    Math.max(
      0,
      rating
    )
  );
}

// ======================================================
// Integer Parsing
// ======================================================

function parseNonNegativeInteger(
  value: unknown
): number | null {
  if (
    typeof value === "number"
  ) {
    if (
      !Number.isFinite(value)
    ) {
      return null;
    }

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

  if (
    !/^\d+$/.test(
      normalized
    )
  ) {
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
// Brand Extraction
// ======================================================

function extractBrand(
  title: string
): string {
  const normalized =
    decodeHtmlEntities(
      title
    )
      .replace(
        /^\s*[-|]+/,
        ""
      )
      .trim();

  const firstSegment =
    normalized
      .split("|")[0]
      ?.trim() ?? "";

  if (!firstSegment) {
    return "Unknown";
  }

  const firstWord =
    firstSegment
      .split(/\s+/)[0]
      ?.trim() ?? "";

  if (!firstWord) {
    return "Unknown";
  }

  const matchedBrand =
    KNOWN_BRANDS.find(
      (brand) =>
        firstWord.toLowerCase() ===
        brand.toLowerCase()
    );

  return (
    matchedBrand ??
    firstWord
  );
}

// ======================================================
// Category Detection
// ======================================================

function detectCategory(
  title: string
): string {
  const normalized =
    decodeHtmlEntities(
      title
    ).toLowerCase();

  if (
    /\b(laptop|notebook|macbook)\b/i.test(
      normalized
    )
  ) {
    return "laptop";
  }

  if (
    /\b(phone|smartphone|mobile)\b/i.test(
      normalized
    )
  ) {
    return "smartphone";
  }

  return DEFAULT_CATEGORY;
}

// ======================================================
// Specification Extraction
// ======================================================

function extractSpecs(
  title: string
): Record<string, JsonValue> {
  const normalized =
    decodeHtmlEntities(
      title
    );

  const specs:
    Record<string, JsonValue> =
    {};

  // ====================================================
  // RAM
  // ====================================================

  const ram =
    extractRam(normalized);

  if (ram !== null) {
    specs.ram = ram;
  }

  // ====================================================
  // Storage
  // ====================================================

  const storage =
    extractStorage(normalized);

  if (storage !== null) {
    specs.storage = storage;
  }

  // ====================================================
  // Battery
  // ====================================================

  const batteryMatch =
    normalized.match(
      /(\d{3,5})\s*mAh\b/i
    );

  if (
    batteryMatch?.[1]
  ) {
    const battery =
      Number(
        batteryMatch[1]
      );

    if (
      Number.isFinite(battery) &&
      battery > 0
    ) {
      specs.battery =
        battery;
    }
  }

  // ====================================================
  // Display Size
  // ====================================================

  const displayMatch =
    normalized.match(
      /(\d+(?:\.\d+)?)\s*(?:["″]|inch(?:es)?)\b/i
    );

  if (
    displayMatch?.[1]
  ) {
    const displaySize =
      Number(
        displayMatch[1]
      );

    if (
      Number.isFinite(displaySize) &&
      displaySize > 0 &&
      displaySize < 20
    ) {
      specs.displaySize =
        displaySize;
    }
  }

  // ====================================================
  // Refresh Rate
  // ====================================================

  const refreshMatch =
    normalized.match(
      /(\d{2,3})\s*Hz\b/i
    );

  if (
    refreshMatch?.[1]
  ) {
    const refreshRate =
      Number(
        refreshMatch[1]
      );

    if (
      Number.isFinite(refreshRate) &&
      refreshRate > 0
    ) {
      specs.refreshRate =
        refreshRate;
    }
  }

  // ====================================================
  // Charging Speed
  // ====================================================

  const chargingMatch =
    normalized.match(
      /(\d{2,3})\s*W\b/i
    );

  if (
    chargingMatch?.[1]
  ) {
    const chargingSpeed =
      Number(
        chargingMatch[1]
      );

    if (
      Number.isFinite(chargingSpeed) &&
      chargingSpeed > 0
    ) {
      specs.chargingSpeed =
        chargingSpeed;
    }
  }

  // ====================================================
  // Camera
  // ====================================================

  const cameraMatch =
    normalized.match(
      /(\d{2,4})\s*MP\b/i
    );

  if (
    cameraMatch?.[1]
  ) {
    const cameraMp =
      Number(
        cameraMatch[1]
      );

    if (
      Number.isFinite(cameraMp) &&
      cameraMp > 0 &&
      cameraMp <= 500
    ) {
      specs.cameraMp =
        cameraMp;
    }
  }

  // ====================================================
  // Front Camera
  // ====================================================

  const frontCameraMatch =
    normalized.match(
      /(?:front|selfie)[^|,;]*?(\d{2,3})\s*MP\b/i
    );

  if (
    frontCameraMatch?.[1]
  ) {
    const frontCameraMp =
      Number(
        frontCameraMatch[1]
      );

    if (
      Number.isFinite(frontCameraMp) &&
      frontCameraMp > 0
    ) {
      specs.frontCameraMp =
        frontCameraMp;
    }
  }

  // ====================================================
  // Chipset / Processor
  // ====================================================

  const processorPatterns = [
    /*
     * Snapdragon examples:
     * Snapdragon 8 Gen 3
     * Snapdragon 8s Gen 3
     * Snapdragon 7 Gen 4
     * Snapdragon 6s Gen 4
     * Snapdragon 695 5G
     */
    /Snapdragon\s+[A-Za-z0-9+.-]+(?:\s+Gen\s*\d+)?(?:\s+[A-Za-z0-9+.-]+)?/i,

    /*
     * MediaTek Dimensity examples:
     * Dimensity 9400
     * Dimensity 8400 Ultra
     * Dimensity 7400
     */
    /Dimensity\s+\d+[A-Za-z0-9+.-]*(?:\s+(?:Ultra|Pro|Max))?/i,

    /*
     * MediaTek Helio examples:
     * MediaTek Helio G99
     * MediaTek Helio G100
     */
    /MediaTek\s+Helio\s+[A-Za-z0-9+.-]+/i,

    /*
     * Unisoc examples:
     * Unisoc T820
     * Unisoc T760
     */
    /Unisoc\s+[A-Za-z0-9+.-]+/i,

    /*
     * Apple examples:
     * Apple A18 Pro
     * Apple A17 Pro
     * Apple A16 Bionic
     */
    /Apple\s+A\d+\s*(?:Bionic|Pro)?/i,

    /*
     * Exynos examples:
     * Exynos 2400
     * Exynos 1580
     */
    /Exynos\s+[A-Za-z0-9+.-]+/i,
  ];

  for (
    const pattern of
      processorPatterns
  ) {
    const match =
      normalized.match(
        pattern
      );

    if (
      match?.[0]
    ) {
      const chipset =
        normalizeChipsetName(
          match[0]
        );

      if (chipset) {
        specs.chipset =
          chipset;

        const processorScore =
          getProcessorScore(
            chipset
          );

        /*
         * Missing processor classification is
         * represented as missing data, not zero.
         */
        if (
          processorScore !== null
        ) {
          specs.processorScore =
            processorScore;
        }
      }

      break;
    }
  }

  // ====================================================
  // Feature Flags
  // ====================================================

  if (
    /\bfast charging\b/i.test(
      normalized
    ) ||
    /\b\d{2,3}\s*W\b/i.test(
      normalized
    ) ||
    /\bturbopower\b/i.test(
      normalized
    ) ||
    /\bsupervooc\b/i.test(
      normalized
    )
  ) {
    specs.fastCharging =
      true;
  }

  if (
    /\bIP\d{2}\b/i.test(
      normalized
    )
  ) {
    specs.waterproof =
      true;
  }

  if (
    /\bfingerprint\b/i.test(
      normalized
    ) ||
    /\bface unlock\b/i.test(
      normalized
    )
  ) {
    specs.fingerprint =
      true;
  }

  if (
    /\bwireless charging\b/i.test(
      normalized
    )
  ) {
    specs.wirelessCharging =
      true;
  }

  if (
    /\bexpandable\b/i.test(
      normalized
    ) ||
    /\bexpandable storage\b/i.test(
      normalized
    )
  ) {
    specs.expandableStorage =
      true;
  }

  return specs;
}

// ======================================================
// RAM Extraction
// ======================================================

/**
 * Extracts RAM from real marketplace title formats.
 *
 * Supported:
 *   8GB RAM
 *   12 GB RAM
 *   8GB + 256GB
 *   12GB, 512GB
 *   12GB/512GB
 *   12+256GB
 *   8GB 256GB Storage
 *   12GB LPDDR5X
 *
 * A standalone "256GB Storage" is never treated as RAM.
 */
function extractRam(
  title: string
): number | null {
  // ----------------------------------------------------
  // 1. Explicit RAM
  // ----------------------------------------------------

  const explicitPatterns = [
    /\b(\d+(?:\.\d+)?)\s*GB\s*RAM\b/i,
    /\b(\d+(?:\.\d+)?)\s*GB\s*LPDDR(?:[345X]+)?\b/i,
  ];

  for (
    const pattern of
      explicitPatterns
  ) {
    const match =
      title.match(
        pattern
      );

    if (
      !match?.[1]
    ) {
      continue;
    }

    const value =
      Number(
        match[1]
      );

    if (
      isValidRam(value)
    ) {
      return value;
    }
  }

  // ----------------------------------------------------
  // 2. RAM + Storage Pair
  // ----------------------------------------------------

  const pairPatterns = [
    /\b(\d{1,3})\s*GB\s*(?:\+|\/|,|\||-)\s*(\d{2,4})\s*(GB|TB)\b/i,

    /\b(\d{1,3})\s*GB\s+(\d{2,4})\s*(GB|TB)\s*(?:Storage|ROM)\b/i,
  ];

  for (
    const pattern of
      pairPatterns
  ) {
    const match =
      title.match(
        pattern
      );

    if (
      !match?.[1] ||
      !match[2] ||
      !match[3]
    ) {
      continue;
    }

    const ram =
      Number(
        match[1]
      );

    const storageValue =
      Number(
        match[2]
      );

    const storageUnit =
      match[3].toUpperCase();

    const storage =
      storageUnit === "TB"
        ? storageValue * 1024
        : storageValue;

    if (
      isValidRam(ram) &&
      isValidStorageCapacity(
        storage
      )
    ) {
      return ram;
    }
  }

  // ----------------------------------------------------
  // 3. Compact RAM + Storage
  // ----------------------------------------------------
  //
  // Examples:
  // 12+256GB
  // 8+128GB
  //

  const compactMatch =
    title.match(
      /\b(\d{1,3})\s*\+\s*(\d{2,4})\s*GB\b/i
    );

  if (
    compactMatch?.[1] &&
    compactMatch[2]
  ) {
    const ram =
      Number(
        compactMatch[1]
      );

    const storage =
      Number(
        compactMatch[2]
      );

    if (
      isValidRam(ram) &&
      isValidStorageCapacity(
        storage
      )
    ) {
      return ram;
    }
  }

  // ----------------------------------------------------
  // 4. Compact Slash Format
  // ----------------------------------------------------
  //
  // Examples:
  // 8/256GB
  // 12/512GB
  //

  const slashMatch =
    title.match(
      /\b(\d{1,3})\s*\/\s*(\d{2,4})\s*GB\b/i
    );

  if (
    slashMatch?.[1] &&
    slashMatch[2]
  ) {
    const ram =
      Number(
        slashMatch[1]
      );

    const storage =
      Number(
        slashMatch[2]
      );

    if (
      isValidRam(ram) &&
      isValidStorageCapacity(
        storage
      )
    ) {
      return ram;
    }
  }

  // ----------------------------------------------------
  // 5. Sequential Capacities
  // ----------------------------------------------------
  //
  // Examples:
  // 12GB 512GB
  // 8GB 256GB Storage
  //

  const sequentialMatch =
    title.match(
      /\b(\d{1,3})\s*GB\s+(\d{2,4})\s*GB(?:\s*(?:Storage|ROM))?\b/i
    );

  if (
    sequentialMatch?.[1] &&
    sequentialMatch[2]
  ) {
    const ram =
      Number(
        sequentialMatch[1]
      );

    const storage =
      Number(
        sequentialMatch[2]
      );

    if (
      isValidRam(ram) &&
      isValidStorageCapacity(
        storage
      ) &&
      storage > ram
    ) {
      return ram;
    }
  }

  return null;
}

// ======================================================
// Storage Extraction
// ======================================================

function extractStorage(
  title: string
): number | null {
  // ----------------------------------------------------
  // 1. Explicit Storage
  // ----------------------------------------------------

  const explicitMatch =
    title.match(
      /\b(\d+(?:\.\d+)?)\s*(GB|TB)\s*(?:Storage|ROM)\b/i
    );

  if (
    explicitMatch?.[1] &&
    explicitMatch[2]
  ) {
    const value =
      Number(
        explicitMatch[1]
      );

    const unit =
      explicitMatch[2].toUpperCase();

    if (
      Number.isFinite(value) &&
      value > 0
    ) {
      const storage =
        unit === "TB"
          ? value * 1024
          : value;

      if (
        isValidStorageCapacity(
          storage
        )
      ) {
        return storage;
      }
    }
  }

  // ----------------------------------------------------
  // 2. RAM + Storage Pair
  // ----------------------------------------------------

  const pairMatch =
    title.match(
      /\b(\d{1,3})\s*GB\s*(?:\+|\/|,|\||-)\s*(\d{2,4})\s*(GB|TB)\b/i
    );

  if (
    pairMatch?.[1] &&
    pairMatch[2] &&
    pairMatch[3]
  ) {
    const ram =
      Number(
        pairMatch[1]
      );

    const storageValue =
      Number(
        pairMatch[2]
      );

    const unit =
      pairMatch[3].toUpperCase();

    const storage =
      unit === "TB"
        ? storageValue * 1024
        : storageValue;

    if (
      isValidRam(ram) &&
      isValidStorageCapacity(
        storage
      )
    ) {
      return storage;
    }
  }

  // ----------------------------------------------------
  // 3. Compact Format
  // ----------------------------------------------------
  //
  // 12+256GB
  //

  const compactMatch =
    title.match(
      /\b(\d{1,3})\s*\+\s*(\d{2,4})\s*GB\b/i
    );

  if (
    compactMatch?.[1] &&
    compactMatch[2]
  ) {
    const ram =
      Number(
        compactMatch[1]
      );

    const storage =
      Number(
        compactMatch[2]
      );

    if (
      isValidRam(ram) &&
      isValidStorageCapacity(
        storage
      )
    ) {
      return storage;
    }
  }

  // ----------------------------------------------------
  // 4. Slash Format
  // ----------------------------------------------------
  //
  // 12/512GB
  //

  const slashMatch =
    title.match(
      /\b(\d{1,3})\s*\/\s*(\d{2,4})\s*GB\b/i
    );

  if (
    slashMatch?.[1] &&
    slashMatch[2]
  ) {
    const ram =
      Number(
        slashMatch[1]
      );

    const storage =
      Number(
        slashMatch[2]
      );

    if (
      isValidRam(ram) &&
      isValidStorageCapacity(
        storage
      )
    ) {
      return storage;
    }
  }

  return null;
}

// ======================================================
// RAM Validation
// ======================================================

function isValidRam(
  value: number
): boolean {
  return (
    Number.isFinite(value) &&
    value > 0 &&
    value <= 256
  );
}

// ======================================================
// Storage Validation
// ======================================================

function isValidStorageCapacity(
  value: number
): boolean {
  return (
    Number.isFinite(value) &&
    value >= 32 &&
    value <= 16384
  );
}

// ======================================================
// Chipset Normalization
// ======================================================

function normalizeChipsetName(
  value: string
): string | null {
  const normalized =
    value
      .replace(/\s+/g, " ")
      .trim();

  if (!normalized) {
    return null;
  }

  return normalized;
}

// ======================================================
// Processor Score
// ======================================================

/**
 * Returns a normalized processor capability score
 * on a 0-10 scale.
 *
 * This is a deterministic product-tier heuristic,
 * not a synthetic benchmark score.
 *
 * The Decision Engine later normalizes this value
 * against the processor weight for the selected intent.
 */
function getProcessorScore(
  chipset: string
): number | null {
  const normalized =
    chipset
      .trim()
      .toLowerCase()
      .replace(/\s+/g, " ");

  if (!normalized) {
    return null;
  }

  // ====================================================
  // Apple Silicon
  // ====================================================

  const appleMatch =
    normalized.match(
      /\ba(\d+)\b/
    );

  if (
    appleMatch?.[1]
  ) {
    const generation =
      Number(
        appleMatch[1]
      );

    if (
      Number.isFinite(
        generation
      )
    ) {
      if (generation >= 19) {
        return 10;
      }

      if (generation === 18) {
        return 9.8;
      }

      if (generation === 17) {
        return 9.5;
      }

      if (generation === 16) {
        return 9.2;
      }

      if (generation === 15) {
        return 8.8;
      }

      if (generation === 14) {
        return 8.4;
      }

      if (generation === 13) {
        return 8.0;
      }

      if (generation === 12) {
        return 7.6;
      }

      if (generation === 11) {
        return 7.2;
      }

      if (generation === 10) {
        return 6.8;
      }

      if (generation >= 8) {
        return 6.2;
      }
    }

    return null;
  }

  // ====================================================
  // Snapdragon
  // ====================================================

  const snapdragonMatch =
    normalized.match(
      /snapdragon\s+([a-z0-9-]+)/
    );

  if (
    snapdragonMatch?.[1]
  ) {
    const model =
      snapdragonMatch[1];

    if (
      model === "8" &&
      /\belite\b/i.test(
        normalized
      )
    ) {
      return 10;
    }

    if (
      /^8(?:s)?$/i.test(
        model
      )
    ) {
      return 9.5;
    }

    if (
      /^7(?:s|\+)?$/i.test(
        model
      )
    ) {
      return 8.0;
    }

    if (
      /^6(?:s)?$/i.test(
        model
      )
    ) {
      return 6.5;
    }

    if (
      /^4(?:s)?$/i.test(
        model
      )
    ) {
      return 4.5;
    }

    const numericModel =
      Number(
        model.replace(
          /[^\d]/g,
          ""
        )
      );

    if (
      Number.isFinite(
        numericModel
      ) &&
      numericModel > 0
    ) {
      if (
        numericModel >= 800
      ) {
        return 9.0;
      }

      if (
        numericModel >= 700
      ) {
        return 7.8;
      }

      if (
        numericModel >= 600
      ) {
        return 6.2;
      }

      if (
        numericModel >= 400
      ) {
        return 4.5;
      }
    }
  }

  // ====================================================
  // MediaTek Dimensity
  // ====================================================

  const dimensityMatch =
    normalized.match(
      /dimensity\s+(\d+)/
    );

  if (
    dimensityMatch?.[1]
  ) {
    const model =
      Number(
        dimensityMatch[1]
      );

    if (
      Number.isFinite(
        model
      )
    ) {
      if (
        model >= 9000
      ) {
        return 9.5;
      }

      if (
        model >= 8000
      ) {
        return 8.5;
      }

      if (
        model >= 7000
      ) {
        return 7.5;
      }

      if (
        model >= 6000
      ) {
        return 6.5;
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

      if (
        model >= 3000
      ) {
        return 3.5;
      }
    }

    return null;
  }

  // ====================================================
  // MediaTek Helio
  // ====================================================

  const helioMatch =
    normalized.match(
      /helio\s+([a-z])?(\d+)/
    );

  if (
    helioMatch?.[2]
  ) {
    const series =
      helioMatch[1]
        ?.toLowerCase();

    const model =
      Number(
        helioMatch[2]
      );

    if (
      Number.isFinite(
        model
      )
    ) {
      if (
        series === "g"
      ) {
        if (model >= 200) {
          return 7.0;
        }

        if (model >= 100) {
          return 6.5;
        }

        if (model >= 90) {
          return 6.0;
        }

        if (model >= 80) {
          return 5.5;
        }

        if (model >= 70) {
          return 5.0;
        }

        if (model >= 50) {
          return 4.5;
        }

        return 4.0;
      }

      if (
        model >= 100
      ) {
        return 4.5;
      }

      return 3.5;
    }

    return null;
  }

  // ====================================================
  // Exynos
  // ====================================================

  const exynosMatch =
    normalized.match(
      /exynos\s+(\d+)/
    );

  if (
    exynosMatch?.[1]
  ) {
    const model =
      Number(
        exynosMatch[1]
      );

    if (
      Number.isFinite(
        model
      )
    ) {
      if (
        model >= 2500
      ) {
        return 9.5;
      }

      if (
        model >= 2400
      ) {
        return 9.0;
      }

      if (
        model >= 2200
      ) {
        return 8.5;
      }

      if (
        model >= 2100
      ) {
        return 8.0;
      }

      if (
        model >= 1400
      ) {
        return 6.0;
      }

      if (
        model >= 1200
      ) {
        return 5.5;
      }

      if (
        model >= 1000
      ) {
        return 5.0;
      }

      if (
        model >= 800
      ) {
        return 4.0;
      }
    }

    return null;
  }

  // ====================================================
  // Unisoc
  // ====================================================

  const unisocMatch =
    normalized.match(
      /unisoc\s+([a-z0-9-]+)/
    );

  if (
    unisocMatch?.[1]
  ) {
    const model =
      unisocMatch[1]
        .toLowerCase();

    if (
      /^t\d+/i.test(
        model
      )
    ) {
      const numericModel =
        Number(
          model.replace(
            /\D/g,
            ""
          )
        );

      if (
        Number.isFinite(
          numericModel
        )
      ) {
        if (
          numericModel >= 900
        ) {
          return 5.5;
        }

        if (
          numericModel >= 800
        ) {
          return 5.0;
        }

        if (
          numericModel >= 700
        ) {
          return 4.5;
        }

        return 4.0;
      }

      return 4.0;
    }

    return 3.5;
  }

  return null;
}

// ======================================================
// Tags
// ======================================================

function buildTags(
  title: string,
  specs: Record<
    string,
    JsonValue
  >
): string[] {
  const normalized =
    decodeHtmlEntities(
      title
    ).toLowerCase();

  const tags =
    new Set<string>();

  // ----------------------------------------------------
  // Network
  // ----------------------------------------------------

  if (
    /\b5g\b/i.test(
      normalized
    )
  ) {
    tags.add("5g");
  }

  // ----------------------------------------------------
  // Usage Intent
  // ----------------------------------------------------

  if (
    /\bgaming\b/i.test(
      normalized
    )
  ) {
    tags.add("gaming");
  }

  // ----------------------------------------------------
  // Display
  // ----------------------------------------------------

  if (
    /\bamoled\b/i.test(
      normalized
    )
  ) {
    tags.add("amoled");
  }

  if (
    /\boled\b/i.test(
      normalized
    )
  ) {
    tags.add("oled");
  }

  if (
    typeof specs.refreshRate ===
      "number" &&
    specs.refreshRate >= 120
  ) {
    tags.add(
      "high-refresh-rate"
    );
  }

  // ----------------------------------------------------
  // Camera
  // ----------------------------------------------------

  if (
    /\bois\b/i.test(
      normalized
    )
  ) {
    tags.add("ois");
  }

  if (
    typeof specs.cameraMp ===
      "number" &&
    specs.cameraMp >= 50
  ) {
    tags.add(
      "high-resolution-camera"
    );
  }

  // ----------------------------------------------------
  // Charging
  // ----------------------------------------------------

  if (
    specs.fastCharging ===
      true
  ) {
    tags.add(
      "fast-charging"
    );
  }

  // ----------------------------------------------------
  // Battery
  // ----------------------------------------------------

  if (
    typeof specs.battery ===
      "number" &&
    specs.battery >= 6000
  ) {
    tags.add(
      "large-battery"
    );
  }

  // ----------------------------------------------------
  // Protection
  // ----------------------------------------------------

  if (
    specs.waterproof ===
      true
  ) {
    tags.add(
      "water-resistant"
    );
  }

  // ----------------------------------------------------
  // Storage
  // ----------------------------------------------------

  if (
    specs.expandableStorage ===
      true
  ) {
    tags.add(
      "expandable-storage"
    );
  }

  // ----------------------------------------------------
  // Wireless Charging
  // ----------------------------------------------------

  if (
    specs.wirelessCharging ===
      true
  ) {
    tags.add(
      "wireless-charging"
    );
  }

  return [
    ...tags,
  ];
}

// ======================================================
// Highlights
// ======================================================

function buildHighlights(
  title: string,
  specs: Record<
    string,
    JsonValue
  >
): string[] {
  const normalized =
    decodeHtmlEntities(
      title
    );

  /*
   * Amazon search titles commonly use "|"
   * to separate major product features.
   */
  const highlights =
    normalized
      .split("|")
      .map(
        (part) =>
          part.trim()
      )
      .filter(
        (part) =>
          part.length > 0
      )
      .map(
        cleanHighlight
      )
      .filter(
        Boolean
      )
      .slice(
        0,
        MAX_HIGHLIGHTS
      );

  if (
    highlights.length > 0
  ) {
    return uniqueStrings(
      highlights
    );
  }

  const fallback:
    string[] = [];

  if (
    typeof specs.ram ===
      "number"
  ) {
    fallback.push(
      `${specs.ram}GB RAM`
    );
  }

  if (
    typeof specs.storage ===
      "number"
  ) {
    fallback.push(
      `${specs.storage}GB storage`
    );
  }

  if (
    typeof specs.battery ===
      "number"
  ) {
    fallback.push(
      `${specs.battery}mAh battery`
    );
  }

  if (
    typeof specs.refreshRate ===
      "number"
  ) {
    fallback.push(
      `${specs.refreshRate}Hz display`
    );
  }

  if (
    typeof specs.chipset ===
      "string"
  ) {
    fallback.push(
      specs.chipset
    );
  }

  return uniqueStrings(
    fallback
  ).slice(
    0,
    MAX_HIGHLIGHTS
  );
}

function cleanHighlight(
  value: string
): string {
  return value
    .replace(
      /^\s*[-•]+\s*/,
      ""
    )
    .replace(
      /\s+/g,
      " "
    )
    .trim();
}

// ======================================================
// Array Utilities
// ======================================================

function uniqueStrings(
  values: string[]
): string[] {
  return [
    ...new Set(
      values
        .map(
          (value) =>
            value.trim()
        )
        .filter(Boolean)
    ),
  ];
}

// ======================================================
// HTML Entity Decoder
// ======================================================

function decodeHtmlEntities(
  value: string
): string {
  return value
    .replace(
      /&amp;/gi,
      "&"
    )
    .replace(
      /&quot;/gi,
      '"'
    )
    .replace(
      /&#x27;/gi,
      "'"
    )
    .replace(
      /&#39;/gi,
      "'"
    )
    .replace(
      /&lt;/gi,
      "<"
    )
    .replace(
      /&gt;/gi,
      ">"
    )
    .replace(
      /&nbsp;/gi,
      " "
    )
    .replace(
      /&#(\d+);/g,
      (
        _match,
        code: string
      ) =>
        String.fromCharCode(
          Number(code)
        )
    )
    .replace(
      /&#x([0-9a-f]+);/gi,
      (
        _match,
        code: string
      ) =>
        String.fromCharCode(
          parseInt(
            code,
            16
          )
        )
    )
    .replace(
      /\s+/g,
      " "
    )
    .trim();
}