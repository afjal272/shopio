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

  /*
   * Reject malformed numeric strings such as:
   * "12.34.56"
   */
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
): Record<
  string,
  JsonValue
> {
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

  /*
   * IMPORTANT:
   * Only match GB immediately associated with RAM.
   *
   * This prevents:
   * "64 GB Storage"
   * from becoming:
   * ram = 64
   */
  const ramMatch =
    normalized.match(
      /(\d+(?:\.\d+)?)\s*GB\s*RAM\b/i
    );

  if (
    ramMatch?.[1]
  ) {
    const ram =
      Number(
        ramMatch[1]
      );

    if (
      Number.isFinite(ram) &&
      ram > 0 &&
      ram <= 256
    ) {
      specs.ram = ram;
    }
  }

  // ====================================================
  // Storage
  // ====================================================

  const storageMatch =
    normalized.match(
      /(\d+(?:\.\d+)?)\s*(GB|TB)\s*(?:Storage|ROM)\b/i
    );

  if (
    storageMatch?.[1] &&
    storageMatch?.[2]
  ) {
    const value =
      Number(
        storageMatch[1]
      );

    const unit =
      storageMatch[2]
        .toUpperCase();

    if (
      Number.isFinite(value) &&
      value > 0
    ) {
      specs.storage =
        unit === "TB"
          ? value * 1024
          : value;
    }
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
      Number.isFinite(
        frontCameraMp
      ) &&
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
    /Snapdragon\s+[A-Za-z0-9+.-]+(?:\s+Gen\s*\d+)?(?:\s+[A-Za-z0-9+.-]+)?/i,

    /Dimensity\s+\d+[A-Za-z0-9+.-]*/i,

    /MediaTek\s+Helio\s+[A-Za-z0-9+.-]+/i,

    /Unisoc\s+[A-Za-z0-9+.-]+/i,

    /Apple\s+A\d+\s*(?:Bionic|Pro)?/i,

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
      specs.chipset =
        match[0].trim();

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