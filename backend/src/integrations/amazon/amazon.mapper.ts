import {
  JsonValue,
  NormalizedAmazonProduct,
} from "./amazon.types";

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
  product_availability?: unknown;
  product_description?: unknown;
  product_details?: unknown;
  product_information?: unknown;
  product_features?: unknown;
  product_feature_bullets?: unknown;
  product_bullets?: unknown;
  about_product?: unknown;
  specifications?: unknown;
  specs?: unknown;
  attributes?: unknown;
  technical_details?: unknown;
  technical_specifications?: unknown;
  product_attributes?: unknown;
  product_specifications?: unknown;
  key_features?: unknown;
  features?: unknown;
  details?: unknown;
  [key: string]: unknown;
}

const DEFAULT_CURRENCY = "INR";
const DEFAULT_CATEGORY = "smartphone";
const MAX_HIGHLIGHTS = 8;
const MAX_SOURCE_LENGTH = 100_000;

const MIN_RAM_GB = 1;
const MAX_RAM_GB = 64;
const MIN_STORAGE_GB = 16;
const MAX_STORAGE_GB = 16_384;

const VALID_STORAGE_GB = new Set([
  16,
  32,
  64,
  128,
  256,
  512,
  1024,
  2048,
  4096,
  8192,
  16384,
]);

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
  "vivo",
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
  "HTC",
];

export function mapAmazonProduct(
  input: unknown,
): NormalizedAmazonProduct | null {
  if (!isRecord(input)) {
    return null;
  }

  const product = input as RawAmazonProduct;

  const externalId = readRequiredString(product.asin);
  const title = readRequiredString(product.product_title);
  const productUrl = readRequiredUrl(product.product_url);
  const price = parsePrice(product.product_price);

  if (
    !externalId ||
    !title ||
    !productUrl ||
    price === null ||
    price <= 0
  ) {
    return null;
  }

  const name = decodeHtmlEntities(title);

  const sourceText = buildSpecificationCorpus(
    product,
    name,
  );

  const specs = extractSpecs(
    sourceText,
    product,
    name,
  );

  return {
    externalId,
    name,
    brand: extractBrand(name),
    price,

    ...(parsePrice(product.product_original_price) !== null &&
    (parsePrice(product.product_original_price) as number) > price
      ? {
          originalPrice: parsePrice(
            product.product_original_price,
          ) as number,
        }
      : {}),

    currency: normalizeCurrency(product.currency),

    productUrl,

    ...(readOptionalUrl(product.product_photo)
      ? {
          imageUrl: readOptionalUrl(
            product.product_photo,
          ) as string,
        }
      : {}),

    ...(parseRating(product.product_star_rating) !== null
      ? {
          rating: parseRating(
            product.product_star_rating,
          ) as number,
        }
      : {}),

    ...(parseNonNegativeInteger(
      product.product_num_ratings,
    ) !== null
      ? {
          reviewsCount: parseNonNegativeInteger(
            product.product_num_ratings,
          ) as number,
        }
      : {}),

    ...(readOptionalString(
      product.product_availability,
    )
      ? {
          availability: readOptionalString(
            product.product_availability,
          ) as string,
        }
      : {}),

    category: detectCategory(name),

    tags: buildTags(
      sourceText,
      specs,
    ),

    highlights: buildHighlights(
      name,
      sourceText,
      specs,
    ),

    weaknesses: [],

    specs,
  };
}

/**
 * Canonical specification normalization.
 *
 * This is the single normalization entry point used by
 * rebuild scripts and validation.
 *
 * Existing structured specifications are preserved.
 * Missing specifications are recovered from textual and
 * nested source data.
 *
 * processorScore is intentionally removed because processor
 * scoring belongs to the decision/scoring layer, not ingestion.
 */
export function normalizeProductSpecs(source: {
  name?: unknown;
  description?: unknown;
  tags?: unknown;
  highlights?: unknown;
  specs?: unknown;
}): Record<string, JsonValue> {
  const name =
    readString(source.name) ?? "";

  const description =
    readString(source.description) ?? "";

  const tags =
    Array.isArray(source.tags)
      ? source.tags.filter(
          (value): value is string =>
            typeof value === "string",
        )
      : [];

  const highlights =
    Array.isArray(source.highlights)
      ? source.highlights.filter(
          (value): value is string =>
            typeof value === "string",
        )
      : [];

  const existing =
    isRecord(source.specs)
      ? sanitizeExistingSpecs(
          source.specs,
        )
      : {};

  const syntheticProduct: RawAmazonProduct = {
    product_title: name,
    product_description: description,
    product_features: highlights,
    tags,
    highlights,
    specs: existing,
  };

  const corpus =
    buildSpecificationCorpus(
      syntheticProduct,
      name,
    );

  const extracted =
    extractSpecs(
      corpus,
      syntheticProduct,
      name,
    );

  const normalized: Record<
    string,
    JsonValue
  > = {
    ...existing,
  };

  for (const [
    key,
    value,
  ] of Object.entries(extracted)) {
    if (
      key === "processorScore"
    ) {
      continue;
    }

    const current =
      normalized[key];

    if (
      !hasMeaningfulSpecValue(
        current,
      )
    ) {
      normalized[key] = value;
      continue;
    }

    /*
     * Textual processor evidence can be more complete
     * than an incomplete legacy processor value.
     */
    if (
      key === "chipset" ||
      key === "processorType"
    ) {
      normalized[key] = value;
    }
  }

  delete normalized.processorScore;

  return normalized;
}

function sanitizeExistingSpecs(
  value: Record<string, unknown>,
): Record<string, JsonValue> {
  const result: Record<
    string,
    JsonValue
  > = {};

  for (const [
    key,
    child,
  ] of Object.entries(value)) {
    if (
      key === "processorScore"
    ) {
      continue;
    }

    if (
      isJsonValue(child)
    ) {
      result[key] = child;
    }
  }

  return result;
}

function hasMeaningfulSpecValue(
  value: unknown,
): boolean {
  if (
    typeof value === "number"
  ) {
    return (
      Number.isFinite(value) &&
      value > 0
    );
  }

  if (
    typeof value === "string"
  ) {
    return (
      value.trim().length > 0
    );
  }

  if (
    typeof value === "boolean"
  ) {
    return true;
  }

  return (
    value !== null &&
    value !== undefined
  );
}

function isJsonValue(
  value: unknown,
): value is JsonValue {
  if (
    value === null ||
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return true;
  }

  if (
    Array.isArray(value)
  ) {
    return value.every(
      isJsonValue,
    );
  }

  if (
    isRecord(value)
  ) {
    return Object.values(
      value,
    ).every(isJsonValue);
  }

  return false;
}

function buildSpecificationCorpus(
  product: RawAmazonProduct,
  title: string,
): string {
  const parts: string[] = [];

  collectText(
    title,
    parts,
    0,
    "title",
  );

  const preferredKeys = [
    "product_description",
    "product_details",
    "product_information",
    "product_features",
    "product_feature_bullets",
    "product_bullets",
    "about_product",
    "specifications",
    "specs",
    "attributes",
    "technical_details",
    "technical_specifications",
    "product_attributes",
    "product_specifications",
    "key_features",
    "features",
    "details",
  ];

  for (
    const key of preferredKeys
  ) {
    collectText(
      product[key],
      parts,
      0,
      normalizeKey(key),
    );
  }

  const ignored =
    new Set([
      "asin",
      "product_url",
      "product_photo",
      "currency",
      "product_price",
      "product_original_price",
      "product_minimum_offer_price",
      "product_star_rating",
      "product_num_ratings",
      "product_availability",
      "sales_volume",
      "delivery",
      "is_best_seller",
      "is_amazon_choice",
      "is_prime",
      "product_badge",
      "has_variations",
    ]);

  for (
    const [
      key,
      value,
    ] of Object.entries(product)
  ) {
    if (
      ignored.has(key) ||
      preferredKeys.includes(key)
    ) {
      continue;
    }

    if (
      isSpecificationKey(key)
    ) {
      collectText(
        value,
        parts,
        0,
        normalizeKey(key),
      );
    }
  }

  return uniqueStrings(
    parts,
  )
    .join(" | ")
    .slice(
      0,
      MAX_SOURCE_LENGTH,
    );
}

function collectText(
  value: unknown,
  output: string[],
  depth: number,
  label?: string,
): void {
  if (
    value == null ||
    depth > 10
  ) {
    return;
  }

  if (
    typeof value === "string"
  ) {
    const text =
      decodeHtmlEntities(
        value,
      ).trim();

    if (text) {
      output.push(
        label
          ? `${label}: ${text}`
          : text,
      );
    }

    return;
  }

  if (
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    output.push(
      label
        ? `${label}: ${String(value)}`
        : String(value),
    );

    return;
  }

  if (
    Array.isArray(value)
  ) {
    for (
      const item of value
    ) {
      collectText(
        item,
        output,
        depth + 1,
        label,
      );
    }

    return;
  }

  if (
    isRecord(value)
  ) {
    for (
      const [
        key,
        child,
      ] of Object.entries(value)
    ) {
      const normalizedKey =
        normalizeKey(key);

      if (
        isIgnoredMetadataKey(
          normalizedKey,
        )
      ) {
        continue;
      }

      collectText(
        child,
        output,
        depth + 1,
        normalizedKey,
      );
    }
  }
}

function extractSpecs(
  sourceText: string,
  product: RawAmazonProduct,
  title: string,
): Record<string, JsonValue> {
  const text =
    normalizeSpecificationText(
      sourceText,
    );

  const specs: Record<
    string,
    JsonValue
  > = {};

  const ram =
    firstValid(
      extractExplicitNumber(
        product,
        [
          "ram",
          "memory",
          "system memory",
          "installed memory",
          "ram size",
          "memory size",
        ],
      ),
      extractRam(text),
    );

  if (
    ram !== null
  ) {
    specs.ram = ram;
  }

  const storage =
    firstValid(
      extractExplicitStorage(
        product,
      ),
      extractStorage(
        text,
        ram,
      ),
    );

  if (
    storage !== null
  ) {
    specs.storage =
      storage;
  }

  const battery =
    firstValid(
      extractExplicitBattery(
        product,
      ),
      extractBattery(text),
    );

  if (
    battery !== null
  ) {
    specs.battery =
      battery;
  }

  const chipset =
    firstText(
      extractExplicitProcessor(
        product,
      ),
      extractChipset(text),
    );

  if (chipset) {
    specs.chipset =
      chipset;
  } else {
    const processorType =
      firstText(
        extractExplicitProcessorType(
          product,
        ),
        extractGenericProcessorType(
          text,
        ),
      );

    if (
      processorType
    ) {
      specs.processorType =
        processorType;
    }
  }

  const camera =
    firstValid(
      extractExplicitCamera(
        product,
        false,
      ),
      extractRearCamera(text),
    );

  if (
    camera !== null
  ) {
    specs.cameraMp =
      camera;
  }

  const frontCamera =
    firstValid(
      extractExplicitCamera(
        product,
        true,
      ),
      extractFrontCamera(text),
    );

  if (
    frontCamera !== null
  ) {
    specs.frontCameraMp =
      frontCamera;
  }

  const displaySize =
    firstValid(
      extractExplicitNumber(
        product,
        [
          "display size",
          "screen size",
          "screen diagonal",
        ],
      ),
      extractDisplaySize(text),
    );

  if (
    displaySize !== null
  ) {
    specs.displaySize =
      displaySize;
  }

  const refreshRate =
    firstValid(
      extractExplicitNumber(
        product,
        [
          "refresh rate",
          "screen refresh rate",
          "display refresh rate",
        ],
      ),
      extractRefreshRate(text),
    );

  if (
    refreshRate !== null &&
    refreshRate >= 30 &&
    refreshRate <= 1000
  ) {
    specs.refreshRate =
      refreshRate;
  }

  const chargingSpeed =
    firstValid(
      extractExplicitNumber(
        product,
        [
          "charging speed",
          "charging power",
          "fast charging",
          "wired charging",
        ],
      ),
      extractChargingSpeed(
        text,
      ),
    );

  if (
    chargingSpeed !== null &&
    chargingSpeed > 0 &&
    chargingSpeed <= 1000
  ) {
    specs.chargingSpeed =
      chargingSpeed;
  }

  const resolution =
    extractResolution(text);

  if (resolution) {
    specs.displayResolution =
      resolution;
  }

  const ramType =
    extractRamType(text);

  if (ramType) {
    specs.ramType =
      ramType;
  }

  const storageType =
    extractStorageType(text);

  if (storageType) {
    specs.storageType =
      storageType;
  }

  const processorCores =
    extractProcessorCores(
      text,
    );

  if (
    processorCores !== null
  ) {
    specs.processorCores =
      processorCores;
  }

  const processorClock =
    extractProcessorClock(
      text,
    );

  if (
    processorClock !== null
  ) {
    specs.processorClockGHz =
      processorClock;
  }

  const operatingSystem =
    extractOperatingSystem(
      text,
    );

  if (operatingSystem) {
    specs.operatingSystem =
      operatingSystem;
  }

  const simType =
    extractSimType(text);

  if (simType) {
    specs.simType =
      simType;
  }

  const ipRating =
    extractIpRating(text);

  if (ipRating) {
    specs.ipRating =
      ipRating;
  }

  if (
    hasFastCharging(text)
  ) {
    specs.fastCharging =
      true;
  }

  if (
    hasWaterResistance(text)
  ) {
    specs.waterproof =
      true;
  }

  if (
    hasFingerprint(text)
  ) {
    specs.fingerprint =
      true;
  }

  if (
    hasWirelessCharging(text)
  ) {
    specs.wirelessCharging =
      true;
  }

  if (
    hasExpandableStorage(text)
  ) {
    specs.expandableStorage =
      true;
  }

  if (
    /\b(ois|optical image stabilization)\b/i.test(
      text,
    )
  ) {
    specs.ois = true;
  }

  if (
    /\b(eis|electronic image stabilization)\b/i.test(
      text,
    )
  ) {
    specs.eis = true;
  }

  if (
    /\b(nfc)\b/i.test(text)
  ) {
    specs.nfc = true;
  }

  if (
    /\b(stereo speakers?|dual speakers?)\b/i.test(
      text,
    )
  ) {
    specs.stereoSpeakers =
      true;
  }

  if (
    /\b(5g)\b/i.test(text)
  ) {
    specs.network5g =
      true;
  }

  reconcileMemorySpecs(
    specs,
    text,
    title,
  );

  return specs;
}

function extractExplicitNumber(
  product: RawAmazonProduct,
  labels: string[],
): number | null {
  const wanted =
    labels.map(normalizeKey);

  let result:
    number | null = null;

  walkRecords(
    product,
    (
      key,
      value,
    ) => {
      if (
        result !== null
      ) {
        return;
      }

      const normalized =
        normalizeKey(key);

      if (
        !wanted.some(
          (label) =>
            normalized === label ||
            normalized.includes(label),
        )
      ) {
        return;
      }

      const number =
        parseFirstNumber(
          value,
        );

      if (
        number !== null
      ) {
        result =
          number;
      }
    },
  );

  return result;
}

function extractExplicitStorage(
  product: RawAmazonProduct,
): number | null {
  let result:
    number | null = null;

  walkRecords(
    product,
    (
      key,
      value,
    ) => {
      if (
        result !== null
      ) {
        return;
      }

      const keyName =
        normalizeKey(key);

      if (
        !/(storage|rom|internal memory|internal storage|built.?in storage|memory capacity)/i.test(
          keyName,
        )
      ) {
        return;
      }

      const text =
        valueToText(value);

      const match =
        text.match(
          /(\d{1,5}(?:\.\d+)?)\s*(GB|GiB|TB)\b/i
        );

      if (match) {
        result =
          normalizeStorageValue(
            Number(match[1]),
            match[2],
          );
      } else {
        const number =
          parseFirstNumber(value);

        if (
          number !== null
        ) {
          result =
            normalizeStorageValue(
              number,
              "GB",
            );
        }
      }
    },
  );

  return result !== null &&
    isValidStorage(result)
    ? result
    : null;
}

function extractExplicitBattery(
  product: RawAmazonProduct,
): number | null {
  let result:
    number | null = null;

  walkRecords(
    product,
    (
      key,
      value,
    ) => {
      if (
        result !== null
      ) {
        return;
      }

      const keyName =
        normalizeKey(key);

      if (
        !/(battery|capacity|battery life|rated capacity)/i.test(
          keyName,
        )
      ) {
        return;
      }

      const text =
        valueToText(value);

      const match =
        text.match(
          /(\d{1,2}(?:,\d{3}){1,2}|\d{4,5})\s*(mAh|milliamp(?:-?hours?)?)\b/i,
        );

      if (match) {
        result =
          normalizeBattery(
            match[1],
          );
      } else {
        const number =
          parseFirstNumber(value);

        if (
          number !== null &&
          number >= 1000 &&
          number <= 30000
        ) {
          result =
            Math.round(number);
        }
      }
    },
  );

  return result;
}

function extractExplicitProcessor(
  product: RawAmazonProduct,
): string | null {
  let result:
    string | null = null;

  walkRecords(
    product,
    (
      key,
      value,
    ) => {
      if (result) {
        return;
      }

      const keyName =
        normalizeKey(key);

      if (
        !/(processor|cpu|chipset|soc|processor model|processor type|platform|chip)/i.test(
          keyName,
        )
      ) {
        return;
      }

      const candidate =
        extractChipset(
          valueToText(value),
        );

      if (candidate) {
        result =
          candidate;
      }
    },
  );

  return result;
}

function extractExplicitProcessorType(
  product: RawAmazonProduct,
): string | null {
  let result:
    string | null = null;

  walkRecords(
    product,
    (
      key,
      value,
    ) => {
      if (result) {
        return;
      }

      const keyName =
        normalizeKey(key);

      if (
        !/(processor|cpu|chipset|soc|processor model|processor type|platform|chip)/i.test(
          keyName,
        )
      ) {
        return;
      }

      const text =
        valueToText(value);

      result =
        extractChipset(text) ??
        extractGenericProcessorType(
          text,
        );
    },
  );

  return result;
}

function extractExplicitCamera(
  product: RawAmazonProduct,
  front: boolean,
): number | null {
  let result:
    number | null = null;

  walkRecords(
    product,
    (
      key,
      value,
    ) => {
      if (
        result !== null
      ) {
        return;
      }

      const keyName =
        normalizeKey(key);

      const cameraKey =
        front
          ? /(front|selfie|secondary).*camera|camera.*(front|selfie|secondary)/i.test(
              keyName,
            )
          : /(rear|main|primary).*camera|camera.*(rear|main|primary)/i.test(
              keyName,
            );

      if (
        !cameraKey ||
        !/camera|sensor|resolution|mp/i.test(
          keyName,
        )
      ) {
        return;
      }

      const match =
        valueToText(
          value,
        ).match(
          /(\d{1,4}(?:\.\d+)?)\s*(?:MP|megapixel)/i,
        );

      if (match) {
        const n =
          Number(match[1]);

        if (
          n >= 2 &&
          n <= 500
        ) {
          result = n;
        }
      } else {
        const n =
          parseFirstNumber(
            value,
          );

        if (
          n !== null &&
          n >= 2 &&
          n <= 500
        ) {
          result = n;
        }
      }
    },
  );

  return result;
}

function walkRecords(
  value: unknown,
  callback: (
    key: string,
    value: unknown,
  ) => void,
  depth = 0,
): void {
  if (
    !isRecord(value) ||
    depth > 10
  ) {
    return;
  }

  for (
    const [
      key,
      child,
    ] of Object.entries(value)
  ) {
    callback(
      key,
      child,
    );

    if (
      isRecord(child)
    ) {
      walkRecords(
        child,
        callback,
        depth + 1,
      );
    } else if (
      Array.isArray(child)
    ) {
      for (
        const item of child
      ) {
        if (
          isRecord(item)
        ) {
          walkRecords(
            item,
            callback,
            depth + 1,
          );
        }
      }
    }
  }
}

function valueToText(
  value: unknown,
): string {
  const parts: string[] = [];

  collectText(
    value,
    parts,
    0,
  );

  return parts.join(" ");
}

function parseFirstNumber(
  value: unknown,
): number | null {
  if (
    typeof value === "number" &&
    Number.isFinite(value)
  ) {
    return value;
  }

  const text =
    valueToText(
      value,
    ).replace(
      /,/g,
      "",
    );

  const match =
    text.match(
      /-?\d+(?:\.\d+)?/,
    );

  return match
    ? Number(match[0])
    : null;
}

function extractRam(
  text: string,
): number | null {
  const patterns = [
    /\b(?:ram|memory|system memory|installed memory|ram size|memory size)\s*[:=\-]?\s*(\d{1,2}(?:\.\d+)?)\s*(?:gb|gib)\b/i,
    /\b(\d{1,2}(?:\.\d+)?)\s*(?:gb|gib)\s*(?:ram|memory|unified memory)\b/i,
    /\b(\d{1,2})\s*gb\s*(?:ram\s*)?(?:\+|\/|\||,|-)\s*\d{2,5}\s*(?:gb|gib|tb)\b/i,
    /\b(\d{1,2})\s*gb\s+\d{2,5}\s*(?:gb|gib|tb)\s*(?:storage|rom|internal)\b/i,
    /\b(?:ram|memory)\s*[:=\-]\s*(\d{1,2})\b/i,
  ];

  for (
    const pattern of patterns
  ) {
    const match =
      text.match(
        pattern,
      );

    if (!match) {
      continue;
    }

    const n =
      Number(match[1]);

    if (
      isValidRam(n)
    ) {
      return n;
    }
  }

  const compact =
    text.match(
      /\b(\d{1,2})\s*,\s*gb\s*,\s*(\d{2,5})\b/i,
    );

  if (compact) {
    const n =
      Number(compact[1]);

    const storage =
      Number(compact[2]);

    if (
      isValidRam(n) &&
      isValidStorage(storage)
    ) {
      return n;
    }
  }

  return null;
}

function extractStorage(
  text: string,
  ram: number | null,
): number | null {
  const patterns = [
    // Storage: 1TB
    // Internal Storage: 512GB
    // Storage Capacity: 256GB
    /\b(?:storage|rom|internal\s+storage|internal\s+memory|built.?in\s+storage|storage\s+capacity|memory\s+capacity)\s*[:=\-]?\s*(\d{1,5}(?:\.\d+)?)\s*(gb|gib|tb)\b/i,

    // 1TB Storage
    // 512GB ROM
    /\b(\d{1,5}(?:\.\d+)?)\s*(gb|gib|tb)\s*(?:storage|rom|internal\s+storage|internal\s+memory|built.?in\s+storage|storage\s+capacity)\b/i,

    // 8GB RAM 1TB Storage
    /\b\d{1,2}\s*(?:gb|gib)\s*ram\s*(?:\+|\/|\||,|-)\s*(\d{1,5}(?:\.\d+)?)\s*(gb|gib|tb)\b/i,

    // 8GB RAM 1TB
    /\b\d{1,2}\s*(?:gb|gib)\s+ram\s+(\d{1,5}(?:\.\d+)?)\s*(gb|gib|tb)\s*(?:storage|rom|internal|memory)?\b/i,

    // 8GB/1TB
    // 8GB + 1TB
    /\b\d{1,2}\s*(?:gb|gib)\s*(?:ram\s*)?(?:\+|\/|\||,|-)\s*(\d{1,5}(?:\.\d+)?)\s*(gb|gib|tb)\b/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);

    if (!match) {
      continue;
    }

    const normalized = normalizeStorageValue(
      Number(match[1]),
      match[2],
    );

    if (
      isValidStorage(normalized) &&
      (ram === null || normalized !== ram)
    ) {
      return normalized;
    }
  }

  // Amazon compact format:
  // 12, GB, 256
  const compact = text.match(
    /\b\d{1,2}\s*,\s*gb\s*,\s*(\d{1,5})\b/i,
  );

  if (compact) {
    const normalized = Number(compact[1]);

    if (
      isValidStorage(normalized) &&
      (ram === null || normalized !== ram)
    ) {
      return normalized;
    }
  }

  // Controlled fallback for:
  // 16GB
  // 32GB
  // 64GB
  // 128GB
  // 256GB
  // 512GB
  // 1TB
  // 2TB
  // 4TB
  const candidates = [
    ...text.matchAll(
      /\b(\d{1,5}(?:\.\d+)?)\s*(gb|gib|tb)\b/gi,
    ),
  ];

  for (const match of candidates) {
    const normalized = normalizeStorageValue(
      Number(match[1]),
      match[2],
    );

    if (
      isValidStorage(normalized) &&
      (ram === null || normalized !== ram) &&
      VALID_STORAGE_GB.has(normalized)
    ) {
      return normalized;
    }
  }

  return null;
}



function extractBattery(
  text: string,
): number | null {
  const patterns = [
    /\b(?:battery|battery capacity|battery size|rated capacity)\s*[:=\-]?\s*(\d{1,2}(?:,\d{3}){1,2}|\d{4,5})\s*(?:mah|milliamp(?:-?hours?))\b/i,
    /\b(\d{1,2}(?:,\d{3}){1,2}|\d{4,5})\s*(?:mah|milliamp(?:-?hours?))\b/i,
    /\b(?:battery|battery capacity|battery size|rated capacity)\s*[:=\-]\s*(\d{4,5})\b/i,
  ];

  for (
    const pattern of patterns
  ) {
    const match =
      text.match(
        pattern,
      );

    if (!match) {
      continue;
    }

    const n =
      normalizeBattery(
        match[1],
      );

    if (
      n !== null
    ) {
      return n;
    }
  }

  return null;
}

function extractRearCamera(
  text: string,
): number | null {
  const labelled = [
    /\b(?:rear|main|primary|wide|wide angle|main sensor)\s*(?:camera|sensor)?[^|;]{0,100}?(\d{1,4}(?:\.\d+)?)\s*(?:mp|megapixel)\b/i,
    /\b(\d{1,4}(?:\.\d+)?)\s*(?:mp|megapixel)\s*(?:rear|main|primary)\s*(?:camera|sensor)?\b/i,
    /\b(?:rear|main|primary)\s*(?:camera|sensor)\s*[:=\-]\s*(\d{1,4}(?:\.\d+)?)\s*(?:mp|megapixel)?\b/i,
  ];

  for (
    const pattern of labelled
  ) {
    const match =
      text.match(
        pattern,
      );

    if (match) {
      const n =
        Number(match[1]);

      if (
        n >= 2 &&
        n <= 500
      ) {
        return n;
      }
    }
  }

  const generic =
    [
      ...text.matchAll(
        /\b(\d{1,4}(?:\.\d+)?)\s*(?:mp|megapixel)\b/gi,
      ),
    ]
      .map(
        (match) =>
          Number(match[1]),
      )
      .filter(
        (n) =>
          n >= 5 &&
          n <= 500,
      );

  return generic.length
    ? Math.max(...generic)
    : null;
}

function extractFrontCamera(
  text: string,
): number | null {
  const patterns = [
    /\b(?:front|selfie|secondary)\s*(?:camera|sensor)?[^|;]{0,100}?(\d{1,4}(?:\.\d+)?)\s*(?:mp|megapixel)\b/i,
    /\b(\d{1,4}(?:\.\d+)?)\s*(?:mp|megapixel)\s*(?:front|selfie|secondary)\s*(?:camera|sensor)?\b/i,
    /\b(?:front|selfie)\s*(?:camera|sensor)\s*[:=\-]\s*(\d{1,4}(?:\.\d+)?)\s*(?:mp|megapixel)?\b/i,
  ];

  for (
    const pattern of patterns
  ) {
    const match =
      text.match(
        pattern,
      );

    if (match) {
      const n =
        Number(match[1]);

      if (
        n >= 2 &&
        n <= 200
      ) {
        return n;
      }
    }
  }

  return null;
}





function extractChipset(
  text: string,
): string | null {
  /*
   * First priority:
   * structured / labelled processor fields.
   */
  const labelled = [
    /\b(?:processor|cpu|chipset|soc|processor model|processor type|platform|chip)\s*[:=\-]\s*([^|;,.]{2,150})/i,
  ];

  for (const pattern of labelled) {
    const match = text.match(pattern);

    if (!match) {
      continue;
    }

    const candidate = normalizeChipsetName(
      match[1],
    );

    if (
      candidate &&
      isConcreteChipset(candidate)
    ) {
      return candidate;
    }
  }

  /*
   * Textual processor families.
   *
   * normalizeChipsetName() performs the final boundary cleanup,
   * so even if the Amazon title contains:
   *
   * Snapdragon 8 Elite for Galaxy 200MP Main Camera 5000mAh
   *
   * only:
   *
   * Snapdragon 8 Elite for Galaxy
   *
   * survives.
   */
  const patterns = [
   /\b(?:qualcomm\s+)?snapdragon\s+\d+[a-z0-9+.-]*(?:\s+(?:gen|elite|pro|plus|ultra|prime)(?:\s*\d+[a-z0-9+.-]*)?)?(?:\s+for\s+[a-z]+)?/i,

    /\b(?:mediatek\s+)?dimensity\s+\d+[a-z0-9+.-]*(?:\s+(?:ultra|max|pro|plus|apex|extreme|for)\b(?:\s+[a-z0-9+.-]+)*)?/i,

    /\b(?:mediatek\s+)?helio\s+[a-z]?\d+[a-z0-9+.-]*/i,

    /\bexynos\s+\d+[a-z0-9+.-]*/i,

    /\btensor\s+g\d+(?:\s+(?:pro|tensor|for)\b(?:\s+[a-z0-9+.-]+)*)?/i,

    /\bapple\s+a\d+(?:\s+(?:bionic|pro|fusion)\b(?:\s+[a-z0-9+.-]+)*)?/i,

    /\bkirin\s+\d+[a-z0-9+.-]*/i,

    /\b(?:unisoc|spreadtrum)\s+[a-z0-9-]+/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);

    if (!match) {
      continue;
    }

    const candidate = normalizeChipsetName(
      match[0],
    );

    if (
      candidate &&
      isConcreteChipset(candidate)
    ) {
      return candidate;
    }
  }

  return null;
}




function extractGenericProcessorType(
  text: string,
): string | null {
  const patterns = [
    /\b(?:octa|hexa|quad|deca|dual)[-\s]?core(?:\s+[a-z0-9.+-]+){0,6}\s+processor\b/i,
    /\b(?:mobile\s+)?processor(?:\s+(?:with|up to|clocked at))?\s+[a-z0-9.+-]+(?:\s+[a-z0-9.+-]+){0,5}/i,
  ];

  for (
    const pattern of patterns
  ) {
    const match =
      text.match(
        pattern,
      );

    if (!match) {
      continue;
    }

    const value =
      match[0]
        .replace(
          /\s+/g,
          " ",
        )
        .trim();

    if (
      value.length <= 120
    ) {
      return value;
    }
  }

  return null;
}



function normalizeChipsetName(
  value: string,
): string | null {
  let cleaned =
    value
      .replace(
        /^\s*(?:processor|cpu|chipset|soc|processor model|processor type|platform|chip)\s*[:=\-]\s*/i,
        "",
      )
      .replace(
        /\s+/g,
        " ",
      )
      .replace(
        /[|;,]+$/g,
        "",
      )
      .trim();

  if (!cleaned) {
    return null;
  }

  /*
   * Amazon frequently concatenates processor and other specs:
   *
   * Snapdragon 8 Elite for Galaxy 200MP Main Camera 5000mAh
   *
   * The following rules terminate processor text at the first
   * recognizable specification boundary.
   */

  cleaned = cleaned
    .replace(
      /\s+\d{1,4}(?:\.\d+)?\s*(?:MP|megapixel)\b[\s\S]*$/i,
      "",
    )
    .replace(
      /\s+\d{4,5}\s*(?:mAh|milliamp(?:-?hours?))\b[\s\S]*$/i,
      "",
    )
    .replace(
      /\s+\d{1,2}\s*(?:GB|GiB)\s*RAM\b[\s\S]*$/i,
      "",
    )
    .replace(
      /\s+\d{1,5}(?:\.\d+)?\s*(?:GB|GiB|TB)\s*(?:Storage|ROM|Internal(?:\s+Storage)?)\b[\s\S]*$/i,
      "",
    )
    .replace(
      /\s+(?:main|rear|primary|front|selfie|secondary)\s+camera\b[\s\S]*$/i,
      "",
    )
    .replace(
      /\s+\d{2,3}\s*(?:Hz|Hertz)\b[\s\S]*$/i,
      "",
    )
    .replace(
      /\s+(?:display|screen|panel)\b[\s\S]*$/i,
      "",
    )
    .replace(
      /\s+/g,
      " ",
    )
    .trim();

  if (!cleaned) {
    return null;
  }

  const patterns = [
    /*
     * Snapdragon
     *
     * Supports:
     * Snapdragon 8 Gen 2
     * Snapdragon 8 Gen 3
     * Snapdragon 8 Elite
     * Snapdragon 8 Elite for Galaxy
     * Snapdragon 7+ Gen 3
     * Snapdragon 6 Gen 1
     */
    /\bsnapdragon\s+\d+[a-z0-9+.-]*(?:\s+(?:gen|elite|pro|plus|ultra|prime)(?:\s*\d+[a-z0-9+.-]*)?)?(?:\s+for\s+[a-z]+)?/i,

    /*
     * MediaTek Dimensity
     */
    /\b(?:dimensity\s+\d+[a-z0-9+.-]*(?:\s+(?:ultra|max|pro|plus|apex|extreme)\b)?(?:\s+for\s+(?:gaming|mobile))?)/i,

    /*
     * MediaTek Helio
     */
    /\b(?:helio\s+[a-z]?\d+[a-z0-9+.-]*)/i,

    /*
     * Samsung Exynos
     */
    /\b(?:exynos\s+\d+[a-z0-9+.-]*)/i,

    /*
     * Google Tensor
     */
    /\b(?:tensor\s+g\d+(?:\s+(?:pro|tensor))?)/i,

    /*
     * Apple
     */
    /\b(?:apple\s+a\d+(?:\s+(?:bionic|pro|fusion))?)/i,

    /*
     * Huawei Kirin
     */
    /\b(?:kirin\s+\d+[a-z0-9+.-]*)/i,

    /*
     * Unisoc / Spreadtrum
     */
    /\b(?:unisoc|spreadtrum)\s+[a-z0-9-]+/i,
  ];

  for (const pattern of patterns) {
    const match = cleaned.match(pattern);

    if (match) {
      return match[0]
        .replace(
          /\s+/g,
          " ",
        )
        .trim();
    }
  }

  return null;
}




function isConcreteChipset(
  value: string,
): boolean {
  return /\b(?:snapdragon\s+\d|dimensity\s+\d|(?:mediatek\s+)?helio\s+[a-z]?\d|exynos\s+\d|tensor\s+g\d|apple\s+a\d|kirin\s+\d|(?:unisoc|spreadtrum)\s+[a-z0-9-]+)\b/i.test(
    value,
  );
}

function extractDisplaySize(
  text: string,
): number | null {
  const patterns = [
    /\b(?:display|screen|panel)\s*(?:size|diagonal)?\s*[:=\-]?\s*(\d+(?:\.\d+)?)\s*(?:inch(?:es)?|in|["″])\b/i,
    /\b(\d+(?:\.\d+)?)\s*(?:inch(?:es)?|in|["″])\s*(?:display|screen|panel)\b/i,
    /\b(\d+(?:\.\d+)?)\s*\([^)]*\)\s*(?:\d{2,3}\s*hz\s*)?(?:display|screen|panel)\b/i,
    /\b(\d+(?:\.\d+)?)\s*(?:display|screen|panel)\b/i,
    /\b(\d+(?:\.\d+)?)\s*(?:inch(?:es)?|in|["″])\b/i,
  ];

  for (
    const pattern of patterns
  ) {
    const match =
      text.match(
        pattern,
      );

    if (!match) {
      continue;
    }

    const n =
      Number(match[1]);

    if (
      n >= 3 &&
      n < 20
    ) {
      return n;
    }
  }

  return null;
}

function extractRefreshRate(
  text: string,
): number | null {
  const match =
    text.match(
      /\b(\d{2,3})\s*(?:hz|hertz)\b/i,
    );

  if (!match) {
    return null;
  }

  const n =
    Number(match[1]);

  return n >= 30 &&
    n <= 1000
    ? n
    : null;
}

function extractChargingSpeed(
  text: string,
): number | null {
  const patterns = [
    /\b(?:charging|charge|charger|wired charging|fast charging|charging power)\s*[:=\-]?[^|;]{0,40}?(\d{2,4})\s*(?:w|watts?)\b/i,
    /\b(\d{2,4})\s*(?:w|watts?)\s*(?:fast charging|charging|supervooc|hypercharge|turbopower|warp charge)\b/i,
    /\b(\d{2,4})\s*(?:w|watts?)\b/i,
  ];

  for (
    const pattern of patterns
  ) {
    const match =
      text.match(
        pattern,
      );

    if (!match) {
      continue;
    }

    const n =
      Number(match[1]);

    if (
      n > 0 &&
      n <= 1000
    ) {
      return n;
    }
  }

  return null;
}

function extractResolution(
  text: string,
): string | null {
  const patterns = [
    /\b(\d{3,5})\s*[x×]\s*(\d{3,5})\s*(?:pixels?|px)?\b/i,
    /\b((?:qhd|fhd|full hd|hd\+|hd|2k|4k|uhd|wqhd|1080p|720p|1220p|1260p|1440p))\b/i,
  ];

  for (
    const pattern of patterns
  ) {
    const match =
      text.match(
        pattern,
      );

    if (
      match?.[1] &&
      match[2]
    ) {
      return `${match[1]}x${match[2]}`;
    }

    if (
      match?.[1]
    ) {
      return match[1]
        .toUpperCase();
    }
  }

  return null;
}

function extractRamType(
  text: string,
): string | null {
  const match =
    text.match(
      /\b(LPDDR[345X]+|DDR[345X]+)\b/i,
    );

  return match
    ? match[1].toUpperCase()
    : null;
}

function extractStorageType(
  text: string,
): string | null {
  const match =
    text.match(
      /\b(UFS\s*[0-9.]+|eMMC\s*[0-9.]*)\b/i,
    );

  return match
    ? match[1]
        .replace(
          /\s+/g,
          " ",
        )
        .toUpperCase()
    : null;
}

function extractProcessorCores(
  text: string,
): number | null {
  const match =
    text.match(
      /\b(?:octa|hexa|quad|deca)[-\s]?core\b/i,
    );

  if (!match) {
    const numeric =
      text.match(
        /\b(\d{1,2})[-\s]?core\b/i,
      );

    return numeric
      ? Number(numeric[1])
      : null;
  }

  const word =
    match[0].toLowerCase();

  return word.includes(
    "octa",
  )
    ? 8
    : word.includes(
        "hexa",
      )
      ? 6
      : word.includes(
          "quad",
        )
        ? 4
        : word.includes(
            "deca",
          )
          ? 10
          : null;
}

function extractProcessorClock(
  text: string,
): number | null {
  const match =
    text.match(
      /\b(?:up to\s*)?(\d+(?:\.\d+)?)\s*ghz\b/i,
    );

  return match
    ? Number(match[1])
    : null;
}

function extractOperatingSystem(
  text: string,
): string | null {
  const patterns = [
    /\b(?:android|ios|hyperos|oxygenos|one ui|coloros|funtouch os|nothing os|harmonyos)\s*[a-z0-9 .+-]*/i,
  ];

  const match =
    text.match(
      patterns[0],
    );

  return match
    ? cleanValue(
        match[0],
        80,
      )
    : null;
}

function extractSimType(
  text: string,
): string | null {
  const match =
    text.match(
      /\b(dual\s+sim|single\s+sim|nano\s+sim|esim|dual\s+nano\s+sim)\b/i,
    );

  return match
    ? match[1]
    : null;
}

function extractIpRating(
  text: string,
): string | null {
  const match =
    text.match(
      /\bIP(?:X\d|\d\d)\b/i,
    );

  return match
    ? match[0].toUpperCase()
    : null;
}

function reconcileMemorySpecs(
  specs: Record<
    string,
    JsonValue
  >,
  text: string,
  title: string,
): void {
  const ram =
    typeof specs.ram === "number"
      ? specs.ram
      : null;

  const storage =
    typeof specs.storage === "number"
      ? specs.storage
      : null;

  if (
    ram !== null &&
    storage !== null &&
    storage <= ram
  ) {
    delete specs.storage;
  }

  if (
    typeof specs.ram !==
    "number"
  ) {
    const recovered =
      extractRam(
        `${title} ${text}`,
      );

    if (
      recovered !== null
    ) {
      specs.ram =
        recovered;
    }
  }

  if (
    typeof specs.storage !==
    "number"
  ) {
    const recovered =
      extractStorage(
        `${title} ${text}`,
        typeof specs.ram ===
          "number"
          ? specs.ram
          : null,
      );

    if (
      recovered !== null
    ) {
      specs.storage =
        recovered;
    }
  }
}

function normalizeSpecificationText(
  value: string,
): string {
  return decodeHtmlEntities(
    value,
  )
    .replace(
      /\u00a0/g,
      " ",
    )
    .replace(
      /[‐-‒–—]/g,
      "-",
    )
    .replace(
      /(\d)\s*,\s*(GB|GiB|TB)\b/gi,
      "$1 $2",
    )
    .replace(
      /(\d{1,2})\s*,\s*(GB|GiB|TB)\s*,\s*(\d{2,5})\s*(GB|GiB|TB)?\b/gi,
      "$1 $2, $3 $4",
    )
    .replace(
      /(\d{1,2})\s*GB\s*(\+|\/|\||,)\s*(\d{2,5})\s*(GB|GiB|TB)\b/gi,
      "$1 GB $2 $3 $4",
    )
    .replace(
      /(\d{1,2}),\s*GB,\s*(\d{2,5})\b/gi,
      "$1 GB, $2",
    )
    .replace(
      /(\d{1,2}),\s*GB\b/gi,
      "$1 GB",
    )
    .replace(
      /(\d{1,2}),\s*(\d{3})\s*mAh\b/gi,
      "$1$2 mAh",
    )
    .replace(
      /(\d{3,5})\s*,\s*mAh\b/gi,
      "$1 mAh",
    )
    .replace(
      /\s+/g,
      " ",
    )
    .trim();
}

function buildTags(
  text: string,
  specs: Record<
    string,
    JsonValue
  >,
): string[] {
  const lower =
    text.toLowerCase();

  const tags =
    new Set<string>();

  if (
    /\b5g\b/.test(lower)
  ) {
    tags.add("5g");
  }

  if (
    /\bgaming\b/.test(lower)
  ) {
    tags.add("gaming");
  }

  if (
    /\bamoled\b/.test(lower)
  ) {
    tags.add("amoled");
  }

  if (
    /\boled\b/.test(lower)
  ) {
    tags.add("oled");
  }

  if (
    typeof specs.refreshRate ===
      "number" &&
    specs.refreshRate >= 120
  ) {
    tags.add(
      "high-refresh-rate",
    );
  }

  if (
    specs.ois === true
  ) {
    tags.add("ois");
  }

  if (
    typeof specs.cameraMp ===
      "number" &&
    specs.cameraMp >= 50
  ) {
    tags.add(
      "high-resolution-camera",
    );
  }

  if (
    specs.fastCharging ===
    true
  ) {
    tags.add(
      "fast-charging",
    );
  }

  if (
    typeof specs.battery ===
      "number" &&
    specs.battery >= 6000
  ) {
    tags.add(
      "large-battery",
    );
  }

  if (
    specs.waterproof ===
    true
  ) {
    tags.add(
      "water-resistant",
    );
  }

  if (
    specs.expandableStorage ===
    true
  ) {
    tags.add(
      "expandable-storage",
    );
  }

  if (
    specs.wirelessCharging ===
    true
  ) {
    tags.add(
      "wireless-charging",
    );
  }

  if (
    specs.nfc === true
  ) {
    tags.add("nfc");
  }

  return [
    ...tags,
  ];
}

function buildHighlights(
  title: string,
  sourceText: string,
  specs: Record<
    string,
    JsonValue
  >,
): string[] {
  const titleParts =
    title
      .split("|")
      .map(
        cleanHighlight,
      )
      .filter(Boolean);

  if (
    titleParts.length
  ) {
    return uniqueStrings(
      titleParts,
    ).slice(
      0,
      MAX_HIGHLIGHTS,
    );
  }

  const fallback: string[] =
    [];

  if (
    typeof specs.ram ===
    "number"
  ) {
    fallback.push(
      `${specs.ram}GB RAM`,
    );
  }

  if (
    typeof specs.storage ===
    "number"
  ) {
    fallback.push(
      formatStorage(
        specs.storage,
      ),
    );
  }

  if (
    typeof specs.battery ===
    "number"
  ) {
    fallback.push(
      `${specs.battery}mAh battery`,
    );
  }

  if (
    typeof specs.refreshRate ===
    "number"
  ) {
    fallback.push(
      `${specs.refreshRate}Hz display`,
    );
  }

  if (
    typeof specs.chipset ===
    "string"
  ) {
    fallback.push(
      specs.chipset,
    );
  } else if (
    typeof specs.processorType ===
    "string"
  ) {
    fallback.push(
      specs.processorType,
    );
  }

  if (
    typeof specs.cameraMp ===
    "number"
  ) {
    fallback.push(
      `${specs.cameraMp}MP camera`,
    );
  }

  if (
    !fallback.length &&
    sourceText
  ) {
    fallback.push(
      sourceText
        .split(
          /[.!?]/,
        )[0]
        ?.trim() ?? "",
    );
  }

  return uniqueStrings(
    fallback,
  ).slice(
    0,
    MAX_HIGHLIGHTS,
  );
}

function hasFastCharging(
  text: string,
): boolean {
  return (
    /\bfast\s*charg(?:ing|e)|supervooc|turbopower|hypercharge|warp\s*charge|dash\s*charge|flashcharge|quick\s*charge|vooc\b/i.test(
      text,
    ) ||
    /\b\d{2,4}\s*W\b/i.test(
      text,
    )
  );
}

function hasWaterResistance(
  text: string,
): boolean {
  return /\bIP(?:X\d|\d\d)\b|water[-\s]?resistant|water[-\s]?proof|dust[-\s]?resistant/i.test(
    text,
  );
}

function hasFingerprint(
  text: string,
): boolean {
  return /\bfingerprint\b|\bin[-\s]?display fingerprint\b/i.test(
    text,
  );
}

function hasWirelessCharging(
  text: string,
): boolean {
  return /\bwireless\s+charg(?:ing|e)\b/i.test(
    text,
  );
}

function hasExpandableStorage(
  text: string,
): boolean {
  return /\bexpandable(?:\s+storage)?\b|micro\s*-?sd|microsd|memory card/i.test(
    text,
  );
}

function isSpecificationKey(
  key: string,
): boolean {
  return /ram|memory|storage|rom|battery|capacity|processor|cpu|chipset|soc|camera|rear|front|selfie|display|screen|resolution|refresh|hz|charging|charger|power|watt|network|connectivity|water|fingerprint|wireless|expandable|micro.?sd|operating system|android|ios|sim/i.test(
    key,
  );
}

function isIgnoredMetadataKey(
  key: string,
): boolean {
  return /^(asin|url|image|photo|currency|price|rating|reviews?|availability|seller|merchant|offer|delivery)$/i.test(
    key,
  );
}

function normalizeKey(
  key: string,
): string {
  return key
    .replace(
      /[_-]+/g,
      " ",
    )
    .replace(
      /([a-z])([A-Z])/g,
      "$1 $2",
    )
    .replace(
      /\s+/g,
      " ",
    )
    .trim()
    .toLowerCase();
}

function isRecord(
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

function readString(
  value: unknown,
): string | null {
  if (
    typeof value !==
    "string"
  ) {
    return null;
  }

  const text =
    value
      .trim()
      .replace(
        /\s+/g,
        " ",
      );

  return text || null;
}

function readRequiredString(
  value: unknown,
): string | null {
  return readString(value);
}

function readOptionalString(
  value: unknown,
): string | undefined {
  return (
    readString(value) ??
    undefined
  );
}

function readRequiredUrl(
  value: unknown,
): string | null {
  const text =
    readString(value);

  return text &&
    isValidHttpsUrl(text)
    ? text
    : null;
}

function readOptionalUrl(
  value: unknown,
): string | undefined {
  const text =
    readString(value);

  return text &&
    isValidHttpsUrl(text)
    ? text
    : undefined;
}

function isValidHttpsUrl(
  value: string,
): boolean {
  try {
    return (
      new URL(
        value,
      ).protocol ===
      "https:"
    );
  } catch {
    return false;
  }
}

function normalizeCurrency(
  value: unknown,
): string {
  const text =
    readString(value);

  return text
    ? text
        .toUpperCase()
        .slice(0, 3)
    : DEFAULT_CURRENCY;
}

function parsePrice(
  value: unknown,
): number | null {
  if (
    typeof value ===
    "number"
  ) {
    return Number.isFinite(
      value,
    ) && value >= 0
      ? Math.round(value)
      : null;
  }

  if (
    typeof value !==
    "string"
  ) {
    return null;
  }

  const cleaned =
    value
      .replace(
        /,/g,
        "",
      )
      .replace(
        /[^\d.]/g,
        "",
      )
      .trim();

  if (
    !/^\d+(?:\.\d+)?$/.test(
      cleaned,
    )
  ) {
    return null;
  }

  const n =
    Number(cleaned);

  return Number.isFinite(
    n,
  ) && n >= 0
    ? Math.round(n)
    : null;
}

function parseRating(
  value: unknown,
): number | null {
  const n =
    typeof value ===
    "number"
      ? value
      : typeof value ===
          "string"
        ? Number(
            value.trim(),
          )
        : NaN;

  return Number.isFinite(
    n,
  )
    ? Math.min(
        5,
        Math.max(
          0,
          n,
        ),
      )
    : null;
}

function parseNonNegativeInteger(
  value: unknown,
): number | null {
  const n =
    typeof value ===
    "number"
      ? value
      : typeof value ===
            "string" &&
          /^\d[\d,]*$/.test(
            value.trim(),
          )
        ? Number(
            value.replace(
              /,/g,
              "",
            ),
          )
        : NaN;

  return Number.isFinite(
    n,
  )
    ? Math.max(
        0,
        Math.round(n),
      )
    : null;
}

function extractBrand(
  title: string,
): string {
  const first =
    title
      .split("|")[0]
      ?.trim() ?? "";

  const matched =
    KNOWN_BRANDS.find(
      (brand) =>
        first
          .toLowerCase()
          .startsWith(
            brand.toLowerCase(),
          ),
    );

  if (matched) {
    return matched;
  }

  return (
    first.split(
      /\s+/,
    )[0] ||
    "Unknown"
  );
}

function detectCategory(
  title: string,
): string {
  const lower =
    title.toLowerCase();

  if (
    /\b(laptop|notebook|macbook)\b/.test(
      lower,
    )
  ) {
    return "laptop";
  }

  if (
    /\b(phone|smartphone|mobile|iphone)\b/.test(
      lower,
    )
  ) {
    return "smartphone";
  }

  return DEFAULT_CATEGORY;
}

function normalizeStorageValue(
  value: number,
  unit: string,
): number {
  return unit.toUpperCase() ===
    "TB"
    ? value * 1024
    : value;
}

function normalizeBattery(
  value: string,
): number | null {
  const n =
    Number(
      value.replace(
        /,/g,
        "",
      ),
    );

  return Number.isFinite(
    n,
  ) &&
    n >= 1000 &&
    n <= 30000
    ? Math.round(n)
    : null;
}

function isValidRam(
  value: number,
): boolean {
  return (
    Number.isFinite(
      value,
    ) &&
    value >=
      MIN_RAM_GB &&
    value <=
      MAX_RAM_GB
  );
}

function isValidStorage(
  value: number,
): boolean {
  return (
    Number.isFinite(
      value,
    ) &&
    value >=
      MIN_STORAGE_GB &&
    value <=
      MAX_STORAGE_GB &&
    (
      VALID_STORAGE_GB.has(
        value,
      ) ||
      value >= 1024
    )
  );
}

function firstValid(
  ...values: Array<
    number | null
  >
): number | null {
  return (
    values.find(
      (value) =>
        value !== null &&
        Number.isFinite(
          value,
        ),
    ) ?? null
  );
}

function firstText(
  ...values: Array<
    string | null
  >
): string | null {
  return (
    values.find(
      (value) =>
        Boolean(value),
    ) ?? null
  );
}

function uniqueStrings(
  values: string[],
): string[] {
  return [
    ...new Set(
      values
        .map(
          (value) =>
            value.trim(),
        )
        .filter(Boolean),
    ),
  ];
}

function cleanHighlight(
  value: string,
): string {
  return value
    .replace(
      /^\s*[-•]+\s*/,
      "",
    )
    .replace(
      /\s+/g,
      " ",
    )
    .trim();
}

function cleanValue(
  value: string,
  max: number,
): string {
  return value
    .replace(
      /\s+/g,
      " ",
    )
    .trim()
    .slice(
      0,
      max,
    );
}

function formatStorage(
  storage: number,
): string {
  return storage >=
      1024 &&
    storage % 1024 ===
      0
    ? `${storage / 1024}TB storage`
    : `${storage}GB storage`;
}

function decodeHtmlEntities(
  value: string,
): string {
  return value
    .replace(
      /&amp;/gi,
      "&",
    )
    .replace(
      /&quot;/gi,
      '"',
    )
    .replace(
      /&#x27;/gi,
      "'",
    )
    .replace(
      /&#39;/gi,
      "'",
    )
    .replace(
      /&lt;/gi,
      "<",
    )
    .replace(
      /&gt;/gi,
      ">",
    )
    .replace(
      /&nbsp;/gi,
      " ",
    )
    .replace(
      /&#(\d+);/g,
      (
        _m,
        code: string,
      ) =>
        String.fromCharCode(
          Number(code),
        ),
    )
    .replace(
      /&#x([0-9a-f]+);/gi,
      (
        _m,
        code: string,
      ) =>
        String.fromCharCode(
          parseInt(
            code,
            16,
          ),
        ),
    )
    .replace(
      /\s+/g,
      " ",
    )
    .trim();
}