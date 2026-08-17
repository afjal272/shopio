import { JsonValue, NormalizedAmazonProduct } from "./amazon.types";

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
  [key: string]: unknown;
}

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

export function mapAmazonProduct(input: unknown): NormalizedAmazonProduct | null {
  if (!isRecord(input)) return null;

  const product = input as RawAmazonProduct;
  const externalId = readRequiredString(product.asin);
  const title = readRequiredString(product.product_title);
  const productUrl = readRequiredUrl(product.product_url);
  const price = parsePrice(product.product_price);

  if (!externalId || !title || !productUrl || price === null || price <= 0) {
    return null;
  }

  const imageUrl = readOptionalUrl(product.product_photo);
  const originalPrice = parsePrice(product.product_original_price);
  const minimumOfferPrice = parsePrice(product.product_minimum_offer_price);
  const rating = parseRating(product.product_star_rating);
  const reviewsCount = parseNonNegativeInteger(product.product_num_ratings);
  const availability = readOptionalString(product.product_availability);
  const currency = normalizeCurrency(product.currency);

  const name = decodeHtmlEntities(title);
  const sourceText = buildSpecificationCorpus(product, name);
  const brand = extractBrand(name);
  const category = detectCategory(name);
  const specs = extractSpecs(sourceText);
  const tags = buildTags(sourceText, specs);
  const highlights = buildHighlights(name, sourceText, specs);

  return {
    externalId,
    name,
    brand,
    price,
    ...(originalPrice !== null && originalPrice > price ? { originalPrice } : {}),
    ...(minimumOfferPrice !== null && minimumOfferPrice > 0 ? { minimumOfferPrice } : {}),
    currency,
    productUrl,
    ...(imageUrl ? { imageUrl } : {}),
    ...(rating !== null ? { rating } : {}),
    ...(reviewsCount !== null ? { reviewsCount } : {}),
    ...(availability ? { availability } : {}),
    category,
    tags,
    highlights,
    weaknesses: [],
    specs,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readString(value: unknown): string | null {
  if (typeof value !== "string") return null;

  const normalized = value.trim().replace(/\s+/g, " ");
  return normalized || null;
}

function readRequiredString(value: unknown): string | null {
  return readString(value);
}

function readOptionalString(value: unknown): string | undefined {
  return readString(value) ?? undefined;
}

function readRequiredUrl(value: unknown): string | null {
  const url = readString(value);
  if (!url) return null;
  return isValidHttpsUrl(url) ? url : null;
}

function readOptionalUrl(value: unknown): string | undefined {
  const url = readString(value);
  if (!url) return undefined;
  return isValidHttpsUrl(url) ? url : undefined;
}

function isValidHttpsUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:";
  } catch {
    return false;
  }
}

function normalizeCurrency(value: unknown): string {
  const currency = readString(value);
  if (!currency) return DEFAULT_CURRENCY;
  return currency.toUpperCase().slice(0, 3);
}

function parsePrice(value: unknown): number | null {
  if (typeof value === "number") {
    if (!Number.isFinite(value) || value < 0) return null;
    return Math.round(value);
  }

  if (typeof value !== "string") return null;

  const normalized = value.replace(/,/g, "").replace(/[^\d.]/g, "").trim();
  if (!normalized || !/^\d+(?:\.\d+)?$/.test(normalized)) return null;

  const parsed = Number(normalized);
  if (!Number.isFinite(parsed) || parsed < 0) return null;

  return Math.round(parsed);
}

function parseRating(value: unknown): number | null {
  let rating: number;

  if (typeof value === "number") {
    rating = value;
  } else if (typeof value === "string") {
    rating = Number(value.trim());
  } else {
    return null;
  }

  if (!Number.isFinite(rating)) return null;
  return Math.min(5, Math.max(0, rating));
}

function parseNonNegativeInteger(value: unknown): number | null {
  if (typeof value === "number") {
    if (!Number.isFinite(value)) return null;
    return Math.max(0, Math.round(value));
  }

  if (typeof value !== "string") return null;

  const normalized = value.replace(/,/g, "").trim();
  if (!/^\d+$/.test(normalized)) return null;

  const parsed = Number(normalized);
  if (!Number.isFinite(parsed)) return null;

  return Math.max(0, Math.round(parsed));
}

function extractBrand(title: string): string {
  const normalized = decodeHtmlEntities(title).replace(/^\s*[-|]+/, "").trim();
  const firstSegment = normalized.split("|")[0]?.trim() ?? "";

  if (!firstSegment) return "Unknown";

  const firstWord = firstSegment.split(/\s+/)[0]?.trim() ?? "";
  if (!firstWord) return "Unknown";

  const matchedBrand = KNOWN_BRANDS.find((brand) => firstWord.toLowerCase() === brand.toLowerCase());
  return matchedBrand ?? firstWord;
}

function detectCategory(title: string): string {
  const normalized = decodeHtmlEntities(title).toLowerCase();

  if (/\b(laptop|notebook|macbook)\b/i.test(normalized)) {
    return "laptop";
  }

  if (/\b(phone|smartphone|mobile|iphone)\b/i.test(normalized)) {
    return "smartphone";
  }

  return DEFAULT_CATEGORY;
}

function buildSpecificationCorpus(product: RawAmazonProduct, title: string): string {
  const sources: unknown[] = [
    title,
    product.product_description,
    product.product_details,
    product.product_information,
    product.product_features,
    product.product_feature_bullets,
    product.product_bullets,
    product.about_product,
    product.specifications,
    product.specs,
    product.attributes,
    product.technical_details,
  ];

  const extracted: string[] = [];

  for (const source of sources) {
    collectText(source, extracted);
  }

  return uniqueStrings(extracted).join(" | ");
}

function collectText(value: unknown, output: string[], depth = 0): void {
  if (depth > 5 || value == null) return;

  if (typeof value === "string") {
    const normalized = decodeHtmlEntities(value).trim();
    if (normalized) output.push(normalized);
    return;
  }

  if (typeof value === "number" || typeof value === "boolean") {
    output.push(String(value));
    return;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      collectText(item, output, depth + 1);
    }
    return;
  }

  if (isRecord(value)) {
    for (const [key, item] of Object.entries(value)) {
      if (depth > 0 && isIgnoredMetadataKey(key)) continue;
      collectText(item, output, depth + 1);
    }
  }
}

function isIgnoredMetadataKey(key: string): boolean {
  return /^(asin|url|image|photo|currency|price|rating|reviews?|availability)$/i.test(key);
}

function extractSpecs(text: string): Record<string, JsonValue> {
  const normalized = decodeHtmlEntities(text);
  const specs: Record<string, JsonValue> = {};

  const ram = extractRam(normalized);
  if (ram !== null) specs.ram = ram;

  const storage = extractStorage(normalized);
  if (storage !== null) specs.storage = storage;

  const battery = extractBattery(normalized);
  if (battery !== null) specs.battery = battery;

  const displaySize = extractDisplaySize(normalized);
  if (displaySize !== null) specs.displaySize = displaySize;

  const refreshRate = extractRefreshRate(normalized);
  if (refreshRate !== null) specs.refreshRate = refreshRate;

  const chargingSpeed = extractChargingSpeed(normalized);
  if (chargingSpeed !== null) specs.chargingSpeed = chargingSpeed;

  const cameraMp = extractCamera(normalized);
  if (cameraMp !== null) specs.cameraMp = cameraMp;

  const frontCameraMp = extractFrontCamera(normalized);
  if (frontCameraMp !== null) specs.frontCameraMp = frontCameraMp;

  const chipset = extractChipset(normalized);
  if (chipset) {
    specs.chipset = chipset;

    const processorScore = getProcessorScore(chipset);
    if (processorScore !== null) specs.processorScore = processorScore;
  }

  if (hasFastCharging(normalized)) specs.fastCharging = true;
  if (hasWaterResistance(normalized)) specs.waterproof = true;
  if (hasFingerprint(normalized)) specs.fingerprint = true;
  if (hasWirelessCharging(normalized)) specs.wirelessCharging = true;
  if (hasExpandableStorage(normalized)) specs.expandableStorage = true;

  return specs;
}

function extractRam(text: string): number | null {
  const explicitPatterns = [
    /\b(\d+(?:\.\d+)?)\s*GB\s*RAM\b/i,
    /\bRAM\s*[:=-]?\s*(\d+(?:\.\d+)?)\s*GB\b/i,
    /\b(\d+(?:\.\d+)?)\s*GB\s*LPDDR(?:[345X]+)?\b/i,
    /\b(\d+(?:\.\d+)?)\s*GB\s*(?:DDR[345X]*|Memory)\b/i,
  ];

  for (const pattern of explicitPatterns) {
    const match = text.match(pattern);
    const value = match?.[1] ? Number(match[1]) : null;

    if (value !== null && isValidRam(value)) {
      return value;
    }
  }

  const pairPatterns = [
    /\b(\d{1,3})\s*GB\s*(?:\+|\/|,|\||-)\s*(\d{2,5})\s*(GB|TB)\b/i,
    /\b(\d{1,3})\s*GB\s+(\d{2,5})\s*(GB|TB)\s*(?:Storage|ROM)\b/i,
    /\b(\d{1,3})\s*GB\s*(?:RAM|Memory)?\s*[\+\|\/,-]\s*(\d{2,5})\s*(GB|TB)\b/i,
  ];

  for (const pattern of pairPatterns) {
    const match = text.match(pattern);
    if (!match?.[1] || !match[2] || !match[3]) continue;

    const ram = Number(match[1]);
    const storageValue = Number(match[2]);
    const storage = match[3].toUpperCase() === "TB" ? storageValue * 1024 : storageValue;

    if (isValidRam(ram) && isValidStorageCapacity(storage) && storage > ram) {
      return ram;
    }
  }

  const compactMatch = text.match(/\b(\d{1,3})\s*\+\s*(\d{2,5})\s*GB\b/i);

  if (compactMatch?.[1] && compactMatch[2]) {
    const ram = Number(compactMatch[1]);
    const storage = Number(compactMatch[2]);

    if (isValidRam(ram) && isValidStorageCapacity(storage) && storage > ram) {
      return ram;
    }
  }

  const slashMatch = text.match(/\b(\d{1,3})\s*\/\s*(\d{2,5})\s*GB\b/i);

  if (slashMatch?.[1] && slashMatch[2]) {
    const ram = Number(slashMatch[1]);
    const storage = Number(slashMatch[2]);

    if (isValidRam(ram) && isValidStorageCapacity(storage) && storage > ram) {
      return ram;
    }
  }

  const sequentialMatch = text.match(/\b(\d{1,3})\s*GB\s+(\d{2,5})\s*GB(?:\s*(?:Storage|ROM))?\b/i);

  if (sequentialMatch?.[1] && sequentialMatch[2]) {
    const ram = Number(sequentialMatch[1]);
    const storage = Number(sequentialMatch[2]);

    if (isValidRam(ram) && isValidStorageCapacity(storage) && storage > ram) {
      return ram;
    }
  }

  return null;
}

function extractStorage(text: string): number | null {
  const explicitPatterns = [
    /\b(\d+(?:\.\d+)?)\s*(GB|TB)\s*(?:Storage|ROM|Internal Storage)\b/i,
    /\b(?:Storage|ROM|Internal Storage)\s*[:=-]?\s*(\d+(?:\.\d+)?)\s*(GB|TB)\b/i,
  ];

  for (const pattern of explicitPatterns) {
    const match = text.match(pattern);
    if (!match?.[1] || !match[2]) continue;

    const value = Number(match[1]);
    const unit = match[2].toUpperCase();
    const storage = unit === "TB" ? value * 1024 : value;

    if (isValidStorageCapacity(storage)) {
      return storage;
    }
  }

  const pairPatterns = [
    /\b(\d{1,3})\s*GB\s*(?:\+|\/|,|\||-)\s*(\d{2,5})\s*(GB|TB)\b/i,
    /\b(\d{1,3})\s*GB\s+(\d{2,5})\s*(GB|TB)\s*(?:Storage|ROM)\b/i,
  ];

  for (const pattern of pairPatterns) {
    const match = text.match(pattern);
    if (!match?.[1] || !match[2] || !match[3]) continue;

    const ram = Number(match[1]);
    const storageValue = Number(match[2]);
    const storage = match[3].toUpperCase() === "TB" ? storageValue * 1024 : storageValue;

    if (isValidRam(ram) && isValidStorageCapacity(storage) && storage > ram) {
      return storage;
    }
  }

  const compactMatch = text.match(/\b(\d{1,3})\s*\+\s*(\d{2,5})\s*GB\b/i);

  if (compactMatch?.[1] && compactMatch[2]) {
    const ram = Number(compactMatch[1]);
    const storage = Number(compactMatch[2]);

    if (isValidRam(ram) && isValidStorageCapacity(storage) && storage > ram) {
      return storage;
    }
  }

  const slashMatch = text.match(/\b(\d{1,3})\s*\/\s*(\d{2,5})\s*GB\b/i);

  if (slashMatch?.[1] && slashMatch[2]) {
    const ram = Number(slashMatch[1]);
    const storage = Number(slashMatch[2]);

    if (isValidRam(ram) && isValidStorageCapacity(storage) && storage > ram) {
      return storage;
    }
  }

  return null;
}

function extractBattery(text: string): number | null {
  const patterns = [
    /\b(\d{3,5}(?:\.\d+)?)\s*mAh\b/i,
    /\b(\d{3,5}(?:\.\d+)?)\s*milliamp(?:-|\s)?hours?\b/i,
    /\bBattery\s*[:=-]?\s*(\d{3,5}(?:\.\d+)?)\s*mAh\b/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (!match?.[1]) continue;

    const value = Number(match[1]);

    if (Number.isFinite(value) && value >= 1000 && value <= 30000) {
      return Math.round(value);
    }
  }

  return null;
}

function extractDisplaySize(text: string): number | null {
  const patterns = [
    /(\d+(?:\.\d+)?)\s*(?:["″]|inch(?:es)?)\b/i,
    /\bdisplay\s*(?:size)?\s*[:=-]?\s*(\d+(?:\.\d+)?)\s*(?:["″]|inch(?:es)?)\b/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (!match?.[1]) continue;

    const value = Number(match[1]);

    if (Number.isFinite(value) && value >= 3 && value < 20) {
      return value;
    }
  }

  return null;
}

function extractRefreshRate(text: string): number | null {
  const match = text.match(/\b(\d{2,3})\s*Hz\b/i);
  if (!match?.[1]) return null;

  const value = Number(match[1]);

  if (!Number.isFinite(value) || value < 30 || value > 1000) {
    return null;
  }

  return value;
}

function extractChargingSpeed(text: string): number | null {
  const patterns = [
    /\b(\d{2,4})\s*W\b/i,
    /\b(\d{2,4})\s*watts?\b/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (!match?.[1]) continue;

    const value = Number(match[1]);

    if (Number.isFinite(value) && value > 0 && value <= 1000) {
      return value;
    }
  }

  return null;
}

function extractCamera(text: string): number | null {
  const patterns = [
    /(?:main|primary|rear|triple|dual|quad)[^|,;]{0,80}?(\d{2,4})\s*MP\b/i,
    /\b(\d{2,4})\s*MP\s*(?:camera|rear|main|primary)\b/i,
    /\b(\d{2,4})\s*MP\b/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (!match?.[1]) continue;

    const value = Number(match[1]);

    if (Number.isFinite(value) && value >= 5 && value <= 500) {
      return value;
    }
  }

  return null;
}

function extractFrontCamera(text: string): number | null {
  const patterns = [
    /(?:front|selfie)[^|,;]{0,80}?(\d{2,3})\s*MP\b/i,
    /\b(\d{2,3})\s*MP\s*(?:front|selfie)\b/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (!match?.[1]) continue;

    const value = Number(match[1]);

    if (Number.isFinite(value) && value > 0 && value <= 200) {
      return value;
    }
  }

  return null;
}

function extractChipset(text: string): string | null {
  const processorPatterns = [
    /\bSnapdragon\s+[A-Za-z0-9+.-]+(?:\s+(?:Gen|Elite|Pro|Plus|Ultra|s)\s*[A-Za-z0-9+.-]*)*/i,
    /\bMediaTek\s+Dimensity\s+\d+[A-Za-z0-9+.-]*(?:\s+(?:Ultra|Pro|Max|Plus))?/i,
    /\bDimensity\s+\d+[A-Za-z0-9+.-]*(?:\s+(?:Ultra|Pro|Max|Plus))?/i,
    /\bMediaTek\s+Helio\s+[A-Za-z0-9+.-]+/i,
    /\bUnisoc\s+[A-Za-z0-9+.-]+/i,
    /\bApple\s+A\d+\s*(?:Bionic|Pro|Fusion)?/i,
    /\bExynos\s+\d+[A-Za-z0-9+.-]*/i,
    /\bKirin\s+\d+[A-Za-z0-9+.-]*/i,
    /\bTensor\s+G\d+/i,
  ];

  for (const pattern of processorPatterns) {
    const match = text.match(pattern);

    if (match?.[0]) {
      const normalized = normalizeChipsetName(match[0]);

      if (normalized) {
        return normalized;
      }
    }
  }

  return null;
}

function hasFastCharging(text: string): boolean {
  return /\bfast\s*charg(?:ing|e)\b/i.test(text) ||
    /\b\d{2,4}\s*W\b/i.test(text) ||
    /\bsupervooc\b/i.test(text) ||
    /\bturbopower\b/i.test(text) ||
    /\bhypercharge\b/i.test(text) ||
    /\bwarp\s*charge\b/i.test(text);
}

function hasWaterResistance(text: string): boolean {
  return /\bIP(?:X[0-9]|[0-9]{2})\b/i.test(text) ||
    /\bwater[-\s]?resistant\b/i.test(text) ||
    /\bwater[-\s]?proof\b/i.test(text);
}

function hasFingerprint(text: string): boolean {
  return /\bfingerprint\b/i.test(text) ||
    /\bface\s*unlock\b/i.test(text);
}

function hasWirelessCharging(text: string): boolean {
  return /\bwireless\s+charg(?:ing|e)\b/i.test(text);
}

function hasExpandableStorage(text: string): boolean {
  return /\bexpandable(?:\s+storage)?\b/i.test(text) ||
    /\bmicro\s*sd\b/i.test(text) ||
    /\bmicrosd\b/i.test(text);
}

function isValidRam(value: number): boolean {
  return Number.isFinite(value) && value > 0 && value <= 256;
}

function isValidStorageCapacity(value: number): boolean {
  return Number.isFinite(value) && value >= 32 && value <= 16384;
}

function normalizeChipsetName(value: string): string | null {
  const normalized = value.replace(/\s+/g, " ").trim();
  return normalized || null;
}

function getProcessorScore(chipset: string): number | null {
  const normalized = chipset.trim().toLowerCase().replace(/\s+/g, " ");

  if (!normalized) return null;

  const appleMatch = normalized.match(/\ba(\d+)\b/);

  if (appleMatch?.[1]) {
    const generation = Number(appleMatch[1]);

    if (!Number.isFinite(generation)) return null;
    if (generation >= 19) return 10;
    if (generation === 18) return 9.8;
    if (generation === 17) return 9.5;
    if (generation === 16) return 9.2;
    if (generation === 15) return 8.8;
    if (generation === 14) return 8.4;
    if (generation === 13) return 8;
    if (generation === 12) return 7.6;
    if (generation === 11) return 7.2;
    if (generation >= 8) return 6.2;

    return null;
  }

  const snapdragonMatch = normalized.match(/\bsnapdragon\s+([a-z0-9-]+)/i);

  if (snapdragonMatch?.[1]) {
    const model = snapdragonMatch[1];

    if (/\belite\b/i.test(normalized) && model === "8") return 10;
    if (/^8(?:s)?$/i.test(model)) return 9.5;
    if (/^7(?:s|\+)?$/i.test(model)) return 8;
    if (/^6(?:s)?$/i.test(model)) return 6.5;
    if (/^4(?:s)?$/i.test(model)) return 4.5;

    const numericModel = Number(model.replace(/[^\d]/g, ""));

    if (Number.isFinite(numericModel) && numericModel > 0) {
      if (numericModel >= 800) return 9;
      if (numericModel >= 700) return 7.8;
      if (numericModel >= 600) return 6.2;
      if (numericModel >= 400) return 4.5;
    }
  }

  const dimensityMatch = normalized.match(/\bdimensity\s+(\d+)/i);

  if (dimensityMatch?.[1]) {
    const model = Number(dimensityMatch[1]);

    if (!Number.isFinite(model)) return null;
    if (model >= 9000) return 9.5;
    if (model >= 8000) return 8.5;
    if (model >= 7000) return 7.5;
    if (model >= 6000) return 6.5;
    if (model >= 5000) return 5.5;
    if (model >= 4000) return 4.5;
    if (model >= 3000) return 3.5;

    return null;
  }

  const helioMatch = normalized.match(/\bhelio\s+([a-z])?(\d+)/i);

  if (helioMatch?.[2]) {
    const series = helioMatch[1]?.toLowerCase();
    const model = Number(helioMatch[2]);

    if (!Number.isFinite(model)) return null;

    if (series === "g") {
      if (model >= 200) return 7;
      if (model >= 100) return 6.5;
      if (model >= 90) return 6;
      if (model >= 80) return 5.5;
      if (model >= 70) return 5;
      if (model >= 50) return 4.5;
      return 4;
    }

    if (model >= 100) return 4.5;
    return 3.5;
  }

  const exynosMatch = normalized.match(/\bexynos\s+(\d+)/i);

  if (exynosMatch?.[1]) {
    const model = Number(exynosMatch[1]);

    if (!Number.isFinite(model)) return null;
    if (model >= 2500) return 9.5;
    if (model >= 2400) return 9;
    if (model >= 2200) return 8.5;
    if (model >= 2100) return 8;
    if (model >= 1400) return 6;
    if (model >= 1200) return 5.5;
    if (model >= 1000) return 5;
    if (model >= 800) return 4;

    return null;
  }

  const unisocMatch = normalized.match(/\bunisoc\s+([a-z0-9-]+)/i);

  if (unisocMatch?.[1]) {
    const model = unisocMatch[1].toLowerCase();
    const numericModel = Number(model.replace(/\D/g, ""));

    if (Number.isFinite(numericModel)) {
      if (numericModel >= 900) return 5.5;
      if (numericModel >= 800) return 5;
      if (numericModel >= 700) return 4.5;
      return 4;
    }

    return 3.5;
  }

  const kirinMatch = normalized.match(/\bkirin\s+(\d+)/i);

  if (kirinMatch?.[1]) {
    const model = Number(kirinMatch[1]);

    if (!Number.isFinite(model)) return null;
    if (model >= 9000) return 9.5;
    if (model >= 8000) return 8.5;
    if (model >= 7000) return 7;
    if (model >= 6000) return 6;

    return 4.5;
  }

  const tensorMatch = normalized.match(/\btensor\s+g(\d+)/i);

  if (tensorMatch?.[1]) {
    const generation = Number(tensorMatch[1]);

    if (!Number.isFinite(generation)) return null;
    if (generation >= 5) return 9;
    if (generation === 4) return 8.5;
    if (generation === 3) return 8;
    if (generation === 2) return 7.5;
    if (generation === 1) return 7;

    return null;
  }

  return null;
}

function buildTags(text: string, specs: Record<string, JsonValue>): string[] {
  const normalized = decodeHtmlEntities(text).toLowerCase();
  const tags = new Set<string>();

  if (/\b5g\b/i.test(normalized)) tags.add("5g");
  if (/\bgaming\b/i.test(normalized)) tags.add("gaming");
  if (/\bamoled\b/i.test(normalized)) tags.add("amoled");
  if (/\boled\b/i.test(normalized)) tags.add("oled");
  if (typeof specs.refreshRate === "number" && specs.refreshRate >= 120) tags.add("high-refresh-rate");
  if (/\bois\b/i.test(normalized)) tags.add("ois");
  if (typeof specs.cameraMp === "number" && specs.cameraMp >= 50) tags.add("high-resolution-camera");
  if (specs.fastCharging === true) tags.add("fast-charging");
  if (typeof specs.battery === "number" && specs.battery >= 6000) tags.add("large-battery");
  if (specs.waterproof === true) tags.add("water-resistant");
  if (specs.expandableStorage === true) tags.add("expandable-storage");
  if (specs.wirelessCharging === true) tags.add("wireless-charging");

  return [...tags];
}

function buildHighlights(title: string, sourceText: string, specs: Record<string, JsonValue>): string[] {
  const normalizedTitle = decodeHtmlEntities(title);

  const highlights = normalizedTitle
    .split("|")
    .map((part) => cleanHighlight(part))
    .filter(Boolean)
    .slice(0, MAX_HIGHLIGHTS);

  if (highlights.length > 0) {
    return uniqueStrings(highlights);
  }

  const fallback: string[] = [];

  if (typeof specs.ram === "number") fallback.push(`${specs.ram}GB RAM`);
  if (typeof specs.storage === "number") fallback.push(formatStorage(specs.storage));
  if (typeof specs.battery === "number") fallback.push(`${specs.battery}mAh battery`);
  if (typeof specs.refreshRate === "number") fallback.push(`${specs.refreshRate}Hz display`);
  if (typeof specs.chipset === "string") fallback.push(specs.chipset);
  if (typeof specs.cameraMp === "number") fallback.push(`${specs.cameraMp}MP camera`);

  if (fallback.length === 0 && sourceText) {
    const firstSentence = sourceText.split(/[.!?]/)[0]?.trim();

    if (firstSentence) {
      fallback.push(firstSentence);
    }
  }

  return uniqueStrings(fallback).slice(0, MAX_HIGHLIGHTS);
}

function formatStorage(storage: number): string {
  if (storage >= 1024 && storage % 1024 === 0) {
    return `${storage / 1024}TB storage`;
  }

  return `${storage}GB storage`;
}

function cleanHighlight(value: string): string {
  return value
    .replace(/^\s*[-•]+\s*/, "")
    .replace(/\s+/g, " ")
    .trim();
}

function uniqueStrings(values: string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#x27;/gi, "'")
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&nbsp;/gi, " ")
    .replace(/&#(\d+);/g, (_match, code: string) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_match, code: string) => String.fromCharCode(parseInt(code, 16)))
    .replace(/\s+/g, " ")
    .trim();
}