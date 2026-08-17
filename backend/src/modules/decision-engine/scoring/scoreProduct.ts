import { Constraints, IntentType, Product, WeightedIntent } from "../types";
import { calculateTrustScore, calculateValueScore } from "./helpers";
import { BRAND_BOOST } from "./weights";

type ScoreComponent = "ram" | "processor" | "battery" | "rating" | "camera";

interface ResolvedSignal {
  value: number;
  available: boolean;
}

interface ScoreContext {
  ram: ResolvedSignal;
  processor: ResolvedSignal;
  battery: ResolvedSignal;
  rating: ResolvedSignal;
  camera: ResolvedSignal;
  reviews: number;
  price: number;
  tags: string[];
  brand: string;
  text: string;
  intents: WeightedIntent[];
}

interface Breakdown {
  ram: number;
  processor: number;
  battery: number;
  rating: number;
  brand: number;
  tags: number;
  trust: number;
  value: number;
  priceFit: number;
  constraints: number;
  tieBreaker: number;
  total: number;
}

const SCORE_MAX = 100;
const PROCESSOR_MAX = 10;
const RAM_REFERENCE_GB = 16;
const BATTERY_REFERENCE_MAH = 6000;
const CAMERA_REFERENCE_MP = 200;
const RATING_REFERENCE = 5;
const MIN_PRICE = 1;

const INTENT_WEIGHTS: Record<IntentType, Record<ScoreComponent, number>> = {
  gaming: { ram: 0.2, processor: 0.55, battery: 0.1, rating: 0.15, camera: 0 },
  camera: { ram: 0.08, processor: 0.12, battery: 0.05, rating: 0.2, camera: 0.55 },
  battery: { ram: 0.08, processor: 0.1, battery: 0.62, rating: 0.2, camera: 0 },
  balanced: { ram: 0.22, processor: 0.28, battery: 0.2, rating: 0.25, camera: 0.05 },
};

const INTENT_TAGS: Record<IntentType, string[]> = {
  gaming: ["gaming", "gaming phone", "game", "performance", "performance phone", "high performance", "high-performance"],
  camera: ["camera", "camera phone", "high-resolution-camera", "high resolution camera", "photography", "photography phone", "video", "video phone"],
  battery: ["battery", "large-battery", "large battery", "long-battery", "long battery", "long-lasting-battery", "long lasting battery", "battery backup", "long battery life"],
  balanced: [],
};

const PROCESSOR_PATTERNS = [
  /\bsnapdragon\s+(?:\d+\s+)?(?:elite|gen|plus|\+|s)?\s*\d*/i,
  /\bdimensity\s+\d{3,5}\s*(?:ultra|max|plus|\+|s)?/i,
  /\bexynos\s+\d{3,4}/i,
  /\bmediatek\s+(?:dimensity|helio)[\w\s+-]*/i,
  /\bhelio\s+[a-z]?\d+/i,
  /\bkirin\s+\d{3,4}/i,
  /\btensor\s+g?\d+/i,
  /\bapple\s+a\d+/i,
  /\ba\d+\s*(?:pro|max|ultra)?\b/i,
  /\bunisoc\s+[a-z]\d+/i,
];

export function scoreProduct(product: Product, intent: IntentType[] | WeightedIntent[], budget: number | null, constraints?: Constraints) {
  const intents = normalizeIntent(intent);
  const context = buildContext(product, intents);
  const breakdown: Breakdown = {
    ram: toPercentage(context.ram.value),
    processor: toPercentage(context.processor.value),
    battery: toPercentage(context.battery.value),
    rating: toPercentage(context.rating.value),
    brand: 0,
    tags: 0,
    trust: 0,
    value: 0,
    priceFit: 0,
    constraints: 0,
    tieBreaker: 0,
    total: 0,
  };

  const coreScore = calculateCoreScore(context);
  const intentBonus = calculateIntentSignals(context);
  const brandBoost = clamp(BRAND_BOOST[context.brand] ?? 0, -0.05, 0.05);
  const tagBoost = calculateTagBoost(context);
  const trustBoost = clamp(calculateTrustScore(context.reviews) * 0.08, 0, 0.08);
  const valueScore = calculateValueScore(
    context.processor.value * PROCESSOR_MAX,
    context.ram.value * RAM_REFERENCE_GB,
    context.price,
  );
  const valueBoost = clamp(valueScore * 2.5, 0, 0.06);
  const priceFit = calculatePriceFit(context.price, budget);
  const constraintScore = constraints ? calculateConstraintScore(product, context, constraints) : 0;
  const tieBreaker = calculateTieBreaker(context);

  breakdown.brand = toPercentage(brandBoost);
  breakdown.tags = toPercentage(tagBoost);
  breakdown.trust = toPercentage(trustBoost);
  breakdown.value = toPercentage(valueBoost);
  breakdown.priceFit = toPercentage(priceFit);
  breakdown.constraints = toPercentage(constraintScore);
  breakdown.tieBreaker = toPercentage(tieBreaker);

  const adjustment = clamp(
    intentBonus + brandBoost + tagBoost + trustBoost + valueBoost + priceFit + constraintScore + tieBreaker,
    -0.25,
    0.25,
  );

  const finalScore = clamp(coreScore * 0.82 + adjustment, 0, 1);
  const calibratedScore = calibrateScore(finalScore);

  breakdown.total = calibratedScore;

  return {
    total: calibratedScore,
    breakdown,
  };
}

function buildContext(product: Product, intents: WeightedIntent[]): ScoreContext {
  const text = buildSearchableText(product);

  const processor = resolveProcessorScore(product, text);
  const ram = resolveRamGb(product, text);
  const battery = resolveBatteryMah(product, text);
  const camera = resolveCameraMp(product, text);
  const rating = resolveRating(product.rating);

  return {
    ram,
    processor,
    battery,
    rating,
    camera,
    reviews: Math.max(0, safeNumber(product.reviewsCount)),
    price: Math.max(0, safeNumber(product.price)),
    tags: normalizeTags(product.tags),
    brand: normalizeText(product.brand),
    text,
    intents,
  };
}

function calculateCoreScore(context: ScoreContext): number {
  let weightedTotal = 0;
  let intentWeightTotal = 0;

  for (const intent of context.intents) {
    const weights = INTENT_WEIGHTS[intent.type];
    if (!weights || intent.weight <= 0) continue;

    const signals: Array<[ScoreComponent, ResolvedSignal]> = [
      ["ram", context.ram],
      ["processor", context.processor],
      ["battery", context.battery],
      ["rating", context.rating],
      ["camera", context.camera],
    ];

    let availableWeight = 0;
    let weightedSignal = 0;

    for (const [component, signal] of signals) {
      const weight = weights[component];
      if (weight <= 0 || !signal.available) continue;
      availableWeight += weight;
      weightedSignal += signal.value * weight;
    }

    if (availableWeight <= 0) continue;

    weightedTotal += (weightedSignal / availableWeight) * intent.weight;
    intentWeightTotal += intent.weight;
  }

  if (intentWeightTotal <= 0) return 0.5;

  return clamp(weightedTotal / intentWeightTotal, 0, 1);
}

function calculateIntentSignals(context: ScoreContext): number {
  let adjustment = 0;

  for (const intent of context.intents) {
    const weight = intent.weight;
    if (weight <= 0) continue;

    const tagMatch = hasAnyTag(context.tags, INTENT_TAGS[intent.type]);
    const textualMatch = hasTextSignal(context.text, INTENT_TAGS[intent.type]);

    switch (intent.type) {
      case "gaming": {
        const signal = weightedAvailable(
          [
            [context.processor, 0.65],
            [context.ram, 0.2],
            [context.battery, 0.15],
          ],
        );
        adjustment += signal * weight * 0.1;
        if (tagMatch || textualMatch) adjustment += 0.025 * weight;
        break;
      }

      case "camera": {
        const signal = weightedAvailable(
          [
            [context.camera, 0.7],
            [context.rating, 0.2],
            [context.processor, 0.1],
          ],
        );
        adjustment += signal * weight * 0.12;
        if (tagMatch || textualMatch) adjustment += 0.025 * weight;
        break;
      }

      case "battery": {
        const signal = weightedAvailable(
          [
            [context.battery, 0.75],
            [context.rating, 0.15],
            [context.processor, 0.1],
          ],
        );
        adjustment += signal * weight * 0.1;
        if (tagMatch || textualMatch) adjustment += 0.025 * weight;
        break;
      }

      case "balanced": {
        const signal = weightedAvailable(
          [
            [context.processor, 0.3],
            [context.ram, 0.2],
            [context.battery, 0.2],
            [context.rating, 0.3],
          ],
        );
        adjustment += signal * weight * 0.04;
        break;
      }
    }
  }

  return adjustment;
}

function calculateTagBoost(context: ScoreContext): number {
  let score = 0;

  for (const intent of context.intents) {
    if (intent.type === "balanced") continue;

    const matches = INTENT_TAGS[intent.type].filter((tag) => {
      const normalizedTag = normalizeText(tag);
      return context.tags.includes(normalizedTag) || context.text.includes(normalizedTag);
    }).length;

    if (matches > 0) score += Math.min(0.035, matches * 0.012) * intent.weight;
  }

  return clamp(score, 0, 0.05);
}

function calculatePriceFit(price: number, budget: number | null): number {
  if (!budget || budget <= 0 || price < MIN_PRICE) return 0;

  const utilization = price / budget;

  if (utilization > 1.25) return -0.2;
  if (utilization > 1.1) return -0.12;
  if (utilization > 1) return -0.06;
  if (utilization >= 0.9) return 0.06;
  if (utilization >= 0.75) return 0.04;
  if (utilization >= 0.55) return 0.02;
  if (utilization >= 0.35) return 0;
  return -0.015;
}

function calculateConstraintScore(product: Product, context: ScoreContext, constraints: Constraints): number {
  let score = 0;
  let checks = 0;

  const ram = context.ram.available ? context.ram.value * RAM_REFERENCE_GB : null;
  const battery = context.battery.available ? context.battery.value * BATTERY_REFERENCE_MAH : null;
  const rating = context.rating.available ? context.rating.value * RATING_REFERENCE : null;
  const price = context.price;

  if (constraints.minRam != null) {
    checks++;
    score += ram != null ? (ram >= constraints.minRam ? 0.035 : -0.08) : -0.02;
  }

  if (constraints.maxRam != null) {
    checks++;
    score += ram != null ? (ram <= constraints.maxRam ? 0.02 : -0.04) : -0.01;
  }

  if (constraints.minBattery != null) {
    checks++;
    score += battery != null ? (battery >= constraints.minBattery ? 0.035 : -0.08) : -0.02;
  }

  if (constraints.maxBattery != null) {
    checks++;
    score += battery != null ? (battery <= constraints.maxBattery ? 0.02 : -0.04) : -0.01;
  }

  if (constraints.minRating != null) {
    checks++;
    score += rating != null ? (rating >= constraints.minRating ? 0.035 : -0.08) : -0.02;
  }

  if (constraints.maxRating != null) {
    checks++;
    score += rating != null ? (rating <= constraints.maxRating ? 0.02 : -0.04) : -0.01;
  }

  if (constraints.minPrice != null) {
    checks++;
    score += price >= constraints.minPrice ? 0.02 : -0.04;
  }

  if (constraints.maxPrice != null) {
    checks++;
    score += price <= constraints.maxPrice ? 0.04 : -0.08;
  }

  if (constraints.preferredBrands?.length) {
    checks++;
    const brand = context.brand;
    const preferred = constraints.preferredBrands.some((item) => normalizeText(item) === brand);
    score += preferred ? 0.04 : -0.015;
  }

  if (constraints.excludedBrands?.length) {
    checks++;
    const brand = context.brand;
    const excluded = constraints.excludedBrands.some((item) => normalizeText(item) === brand);
    if (excluded) score -= 0.12;
  }

  if (constraints.requiredTags?.length) {
    checks++;
    const required = constraints.requiredTags.map(normalizeText).filter(Boolean);
    const matched = required.filter((tag) => context.tags.includes(tag) || context.text.includes(tag)).length;
    score += required.length > 0 ? (matched / required.length) * 0.06 : 0;
    if (matched < required.length) score -= 0.04;
  }

  if (constraints.excludedTags?.length) {
    checks++;
    const excluded = constraints.excludedTags.map(normalizeText).filter(Boolean);
    if (excluded.some((tag) => context.tags.includes(tag) || context.text.includes(tag))) score -= 0.1;
  }

  return checks > 0 ? clamp(score, -0.2, 0.15) : 0;
}

function calculateTieBreaker(context: ScoreContext): number {
  const reviewSignal = Math.min(1, Math.log10(Math.max(context.reviews, 1) + 1) / 5);
  const ratingSignal = context.rating.value;
  const processorSignal = context.processor.value;

  return reviewSignal * 0.006 + ratingSignal * 0.003 + processorSignal * 0.002;
}

function resolveProcessorScore(product: Product, text: string): ResolvedSignal {
  const explicit = safeNumber(product.specs?.processorScore);

  if (explicit > 0) {
    return { value: normalize(explicit, PROCESSOR_MAX), available: true };
  }

  const chipset = typeof product.specs?.chipset === "string" ? product.specs.chipset : "";
  const source = chipset || extractProcessorName(text);

  if (!source) return { value: 0.5, available: false };

  const score = getProcessorScore(source);
  return score > 0 ? { value: normalize(score, PROCESSOR_MAX), available: true } : { value: 0.5, available: false };
}

function getProcessorScore(chipset: string): number {
  const normalized = normalizeText(chipset).replace(/[®™]/g, "").replace(/\s+/g, " ");

  const snapdragon = normalized.match(/snapdragon\s+(.+)/i);
  if (snapdragon?.[1]) {
    const model = snapdragon[1];

    const elite = model.match(/8\s+elite(?:\s+gen\s*(\d+))?/i);
    if (elite) {
      const generation = safeNumber(elite[1]);
      return generation >= 5 ? 10 : generation >= 4 ? 9.9 : 9.8;
    }

    const eightS = model.match(/8s\s+gen\s*(\d+)/i);
    if (eightS) {
      const generation = safeNumber(eightS[1]);
      if (generation >= 4) return 9.3;
      if (generation === 3) return 9;
      if (generation === 2) return 8.6;
      return 8.2;
    }

    const eight = model.match(/8\s+gen\s*(\d+)/i);
    if (eight) {
      const generation = safeNumber(eight[1]);
      if (generation >= 5) return 10;
      if (generation === 4) return 9.8;
      if (generation === 3) return 9.5;
      if (generation === 2) return 9.1;
      return 8.7;
    }

    const sevenPlus = model.match(/7\+\s+gen\s*(\d+)/i);
    if (sevenPlus) {
      const generation = safeNumber(sevenPlus[1]);
      if (generation >= 4) return 9;
      if (generation === 3) return 8.8;
      if (generation === 2) return 8.3;
      return 8;
    }

    const seven = model.match(/7\s+gen\s*(\d+)/i);
    if (seven) {
      const generation = safeNumber(seven[1]);
      if (generation >= 4) return 8.4;
      if (generation === 3) return 8.1;
      if (generation === 2) return 7.7;
      return 7.3;
    }

    const six = model.match(/6\s+gen\s*(\d+)/i);
    if (six) {
      const generation = safeNumber(six[1]);
      if (generation >= 4) return 6.8;
      if (generation === 3) return 6.4;
      if (generation === 2) return 6;
      return 5.5;
    }

    const numeric = model.match(/\b(\d{3,4})\b/);
    if (numeric) {
      const series = safeNumber(numeric[1]);
      if (series >= 800) return 9;
      if (series >= 700) return 7.5;
      if (series >= 600) return 5.5;
      if (series >= 400) return 4;
    }
  }

  const dimensity = normalized.match(/dimensity\s+(\d{3,5})/i);
  if (dimensity) {
    const model = safeNumber(dimensity[1]);
    if (model >= 9500) return 9.8;
    if (model >= 9000) return 9.5;
    if (model >= 8500) return 9;
    if (model >= 8000) return 8.5;
    if (model >= 7500) return 8;
    if (model >= 7300) return 7.6;
    if (model >= 7000) return 7.3;
    if (model >= 6500) return 6.8;
    if (model >= 6300) return 6.5;
    if (model >= 6000) return 6.2;
    if (model >= 5000) return 5.5;
    if (model >= 4000) return 4.5;
  }

  const exynos = normalized.match(/exynos\s+(\d{3,4})/i);
  if (exynos) {
    const model = safeNumber(exynos[1]);
    if (model >= 2500) return 9.4;
    if (model >= 2400) return 9;
    if (model >= 2300) return 8.7;
    if (model >= 2200) return 8.5;
    if (model >= 2100) return 8;
    if (model >= 2000) return 7.4;
    if (model >= 1400) return 6;
    if (model >= 1300) return 5.7;
    if (model >= 1200) return 5.5;
    if (model >= 1000) return 5;
  }

  const helio = normalized.match(/helio\s+([a-z])?(\d+)/i);
  if (helio) {
    const prefix = normalizeText(helio[1] ?? "");
    const model = safeNumber(helio[2]);

    if (prefix === "g") {
      if (model >= 200) return 7;
      if (model >= 100) return 6.5;
      if (model >= 90) return 5.8;
      if (model >= 80) return 5.3;
      if (model >= 70) return 5;
      if (model >= 60) return 4.7;
      if (model >= 50) return 4.4;
    }

    if (prefix === "p") {
      if (model >= 100) return 5;
      if (model >= 90) return 4.5;
      return 4;
    }
  }

  const tensor = normalized.match(/tensor\s+g?(\d+)/i);
  if (tensor) {
    const generation = safeNumber(tensor[1]);
    if (generation >= 5) return 9;
    if (generation === 4) return 8.5;
    if (generation === 3) return 8;
    if (generation === 2) return 7.2;
    return 6.5;
  }

  const kirin = normalized.match(/kirin\s+(\d{3,4})/i);
  if (kirin) {
    const model = safeNumber(kirin[1]);
    if (model >= 9000) return 9.2;
    if (model >= 8000) return 8.2;
    if (model >= 7000) return 6.8;
    if (model >= 6000) return 5.8;
    if (model >= 5000) return 5;
  }

  const apple = normalized.match(/\ba(\d+)\b/i);
  if (apple) {
    const generation = safeNumber(apple[1]);
    if (generation >= 19) return 10;
    if (generation === 18) return 9.8;
    if (generation === 17) return 9.5;
    if (generation === 16) return 9.2;
    if (generation === 15) return 8.8;
    if (generation === 14) return 8.4;
    if (generation === 13) return 8;
    if (generation === 12) return 7.6;
    if (generation === 11) return 7.2;
    if (generation === 10) return 6.8;
  }

  const unisoc = normalized.match(/unisoc\s+([a-z]\d+)/i);
  if (unisoc) {
    const model = unisoc[1];
    const number = safeNumber(model.replace(/[^\d]/g, ""));
    if (/t\d+/i.test(model)) {
      if (number >= 900) return 6;
      if (number >= 800) return 5.5;
      if (number >= 700) return 5;
      if (number >= 600) return 4.5;
    }
  }

  return 0;
}

function resolveRamGb(product: Product, text: string): ResolvedSignal {
  const explicit = parseRamGb(product.specs?.ram);
  if (explicit > 0) return { value: normalize(explicit, RAM_REFERENCE_GB), available: true };

  const explicitMatch = text.match(/(\d+(?:\.\d+)?)\s*gb\s*(?:ram|memory)\b/i);
  if (explicitMatch) {
    const value = safeNumber(explicitMatch[1]);
    if (value > 0 && value <= 256) return { value: normalize(value, RAM_REFERENCE_GB), available: true };
  }

  const capacityMatches = [...text.matchAll(/(\d+(?:\.\d+)?)\s*gb\b/gi)];
  if (capacityMatches.length >= 2) {
    const first = safeNumber(capacityMatches[0]?.[1]);
    const second = safeNumber(capacityMatches[1]?.[1]);
    if (first > 0 && first <= 256 && second > first) return { value: normalize(first, RAM_REFERENCE_GB), available: true };
  }

  if (capacityMatches.length === 1) {
    const value = safeNumber(capacityMatches[0]?.[1]);
    if (value > 0 && value <= 256) return { value: normalize(value, RAM_REFERENCE_GB), available: true };
  }

  return { value: 0.5, available: false };
}

function parseRamGb(value: unknown): number {
  if (typeof value === "number") return Number.isFinite(value) && value >= 0 ? value : 0;
  if (typeof value !== "string") return 0;

  const normalized = value.toLowerCase().replace(/,/g, "").trim();
  if (!normalized) return 0;

  const plusMatch = normalized.match(/(\d+(?:\.\d+)?)\s*gb\s*\+\s*(\d+(?:\.\d+)?)\s*gb/);
  if (plusMatch) {
    const first = safeNumber(plusMatch[1]);
    const second = safeNumber(plusMatch[2]);
    return first + second;
  }

  const match = normalized.match(/(\d+(?:\.\d+)?)\s*gb\b/);
  return match ? safeNumber(match[1]) : safeNumber(normalized);
}

function resolveBatteryMah(product: Product, text: string): ResolvedSignal {
  const explicit = safeNumber(product.specs?.battery);
  if (explicit > 0) return { value: normalizeBattery(explicit), available: true };

  const match = text.match(/(\d{3,5})\s*mAh\b/i);
  if (match) {
    const value = safeNumber(match[1]);
    if (value >= 2000 && value <= 20000) return { value: normalizeBattery(value), available: true };
  }

  return { value: 0.5, available: false };
}

function resolveCameraMp(product: Product, text: string): ResolvedSignal {
  const explicit = safeNumber(product.specs?.cameraMp);
  if (explicit > 0) return { value: normalizeCamera(explicit), available: true };

  const matches = [...text.matchAll(/(\d+(?:\.\d+)?)\s*mp\b/gi)];
  const values = matches.map((match) => safeNumber(match[1])).filter((value) => value > 0 && value <= 500);

  if (values.length > 0) return { value: normalizeCamera(Math.max(...values)), available: true };

  return { value: 0.5, available: false };
}

function resolveRating(value: unknown): ResolvedSignal {
  const rating = safeNumber(value);
  if (rating > 0 && rating <= 5) return { value: normalize(rating, RATING_REFERENCE), available: true };
  return { value: 0.5, available: false };
}

function normalizeBattery(value: number): number {
  return diminishingNormalize(value, 2500, BATTERY_REFERENCE_MAH);
}

function normalizeCamera(value: number): number {
  return diminishingNormalize(value, 8, CAMERA_REFERENCE_MP);
}

function diminishingNormalize(value: number, floor: number, reference: number): number {
  if (!Number.isFinite(value) || value <= 0) return 0;
  if (value <= floor) return clamp((value - floor) / Math.max(floor, 1) * 0.25, 0, 0.25);
  const relative = Math.log1p(value - floor) / Math.log1p(Math.max(reference - floor, 1));
  return clamp(0.25 + relative * 0.75, 0, 1);
}

function normalize(value: number, reference: number): number {
  if (!Number.isFinite(value) || value <= 0 || reference <= 0) return 0;
  return clamp(value / reference, 0, 1);
}

function weightedAvailable(signals: Array<[ResolvedSignal, number]>): number {
  let numerator = 0;
  let denominator = 0;

  for (const [signal, weight] of signals) {
    if (!signal.available || weight <= 0) continue;
    numerator += signal.value * weight;
    denominator += weight;
  }

  return denominator > 0 ? numerator / denominator : 0.5;
}

function extractProcessorName(text: string): string {
  for (const pattern of PROCESSOR_PATTERNS) {
    const match = text.match(pattern);
    if (match?.[0]) return match[0];
  }
  return "";
}

function buildSearchableText(product: Product): string {
  return [
    product.name,
    product.description,
    ...(product.highlights ?? []),
    ...(product.tags ?? []),
    typeof product.specs?.chipset === "string" ? product.specs.chipset : "",
  ]
    .filter((value) => typeof value === "string")
    .join(" ")
    .toLowerCase()
    .replace(/[®™]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeIntent(intent: IntentType[] | WeightedIntent[]): WeightedIntent[] {
  if (!Array.isArray(intent) || intent.length === 0) return [{ type: "balanced", weight: 1 }];

  if (typeof intent[0] === "string") {
    const unique = [...new Set((intent as IntentType[]).filter(isIntentType))];
    if (unique.length === 0) return [{ type: "balanced", weight: 1 }];

    const weight = 1 / unique.length;
    return unique.map((type) => ({ type, weight }));
  }

  const merged = new Map<IntentType, number>();

  for (const item of intent as WeightedIntent[]) {
    if (!item || !isIntentType(item.type) || !Number.isFinite(item.weight) || item.weight <= 0) continue;
    merged.set(item.type, (merged.get(item.type) ?? 0) + item.weight);
  }

  const total = [...merged.values()].reduce((sum, value) => sum + value, 0);
  if (total <= 0) return [{ type: "balanced", weight: 1 }];

  return [...merged.entries()].map(([type, weight]) => ({ type, weight: weight / total }));
}

function isIntentType(value: unknown): value is IntentType {
  return value === "gaming" || value === "camera" || value === "battery" || value === "balanced";
}

function hasAnyTag(tags: string[], candidates: string[]): boolean {
  return candidates.some((candidate) => tags.includes(normalizeText(candidate)));
}

function hasTextSignal(text: string, candidates: string[]): boolean {
  return candidates.some((candidate) => text.includes(normalizeText(candidate)));
}

function normalizeTags(values: unknown): string[] {
  if (!Array.isArray(values)) return [];
  return [...new Set(values.filter((value): value is string => typeof value === "string").map(normalizeText).filter(Boolean))];
}

function normalizeText(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function safeNumber(value: unknown): number {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value !== "string") return 0;

  const normalized = value.trim().replace(/,/g, "");
  if (!normalized) return 0;

  const direct = Number(normalized);
  if (Number.isFinite(direct)) return direct;

  const match = normalized.match(/[-+]?\d+(?:\.\d+)?/);
  if (!match?.[0]) return 0;

  const parsed = Number(match[0]);
  return Number.isFinite(parsed) ? parsed : 0;
}

function toPercentage(value: number): number {
  return Math.round(clamp(value, 0, 1) * 100);
}

function calibrateScore(value: number): number {
  const calibrated = 1 / (1 + Math.exp(-7 * (value - 0.62)));
  return Math.round(clamp(calibrated, 0, 1) * SCORE_MAX);
}

function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
}