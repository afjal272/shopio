import { Constraints, IntentType, Product, WeightedIntent } from "../types";
import { normalize, calculateTrustScore, calculateValueScore } from "./helpers";
import { SCORE_WEIGHTS, BRAND_BOOST } from "./weights";

interface ScoreContext {
  ram: number;
  cpu: number;
  battery: number;
  rating: number;
  camera: number;
  reviews: number;
  price: number;
  tags: string[];
  brand: string;
  weightedIntent: WeightedIntent[];
}

interface ScoreAccumulator {
  core: number;
  adjustment: number;
  breakdown: {
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
  };
}

const MAX_SCORE = 1;
const MIN_ADJUSTMENT = -0.25;
const MAX_ADJUSTMENT = 0.25;
const FINAL_CORE_WEIGHT = 0.8;
const PROCESSOR_MAX_SCORE = 10;
const BATTERY_REFERENCE_MAH = 6000;
const CAMERA_REFERENCE_MP = 200;
const RAM_REFERENCE_GB = 16;
const RATING_REFERENCE = 5;
const MIN_VALID_PRICE = 1;

const PRICE_OVER_BUDGET_PENALTY = {
  severe: -0.25,
  high: -0.18,
  slight: -0.1,
} as const;

const PRICE_WITHIN_BUDGET_BONUS = {
  nearLimit: 0.15,
  upperRange: 0.1,
  middleRange: 0.04,
  lowerRange: -0.02,
  deepDiscount: -0.07,
} as const;

export function scoreProduct(
  product: Product,
  intent: IntentType[] | WeightedIntent[],
  budget: number | null,
  constraints?: Constraints
) {
  const weightedIntent = normalizeIntent(intent);
  const processorScore = resolveProcessorScore(product);
  const resolvedRamGb = resolveRamGb(product);

  const ctx: ScoreContext = {
    ram: normalize(resolvedRamGb, RAM_REFERENCE_GB),
    cpu: normalize(processorScore, PROCESSOR_MAX_SCORE),
    battery: normalize(safeNumber(product.specs?.battery), BATTERY_REFERENCE_MAH),
    rating: normalize(safeNumber(product.rating), RATING_REFERENCE),
    camera: normalize(safeNumber(product.specs?.cameraMp), CAMERA_REFERENCE_MP),
    reviews: Math.max(0, safeNumber(product.reviewsCount)),
    price: Math.max(0, safeNumber(product.price)),
    tags: normalizeTags(product.tags),
    brand: normalizeText(product.brand),
    weightedIntent,
  };

  const score: ScoreAccumulator = {
    core: 0,
    adjustment: 0,
    breakdown: {
      ram: 0,
      processor: 0,
      battery: 0,
      rating: 0,
      brand: 0,
      tags: 0,
      trust: 0,
      value: 0,
      priceFit: 0,
      constraints: 0,
      tieBreaker: 0,
      total: 0,
    },
  };

  for (const currentIntent of ctx.weightedIntent) {
    const config = SCORE_WEIGHTS[currentIntent.type];

    if (!config) {
      continue;
    }

    const weightedScore =
      ctx.ram * config.ram +
      ctx.cpu * config.cpu +
      ctx.battery * config.batt +
      ctx.rating * config.rating;

    score.core += weightedScore * currentIntent.weight;
  }

  let intentAdjustment = 0;

  for (const currentIntent of ctx.weightedIntent) {
    const weight = currentIntent.weight;

    switch (currentIntent.type) {
      case "gaming": {
        const gamingTag = hasAnyTag(ctx.tags, [
          "gaming",
          "gaming phone",
          "game",
          "performance",
          "performance phone",
          "high performance",
          "high-performance",
        ]);

        const gamingSignal =
          ctx.cpu * 0.6 +
          ctx.ram * 0.25 +
          ctx.battery * 0.15;

        intentAdjustment += gamingSignal * weight * 0.2;

        if (gamingTag) {
          intentAdjustment += 0.04 * weight;
        }

        break;
      }

      case "camera": {
        const cameraTag = hasAnyTag(ctx.tags, [
          "camera",
          "camera phone",
          "high-resolution-camera",
          "high resolution camera",
          "photography",
          "photography phone",
          "video",
          "video phone",
        ]);

        const cameraSignal =
          ctx.camera * 0.65 +
          ctx.rating * 0.2 +
          ctx.ram * 0.15;

        intentAdjustment += cameraSignal * weight * 0.25;

        if (cameraTag) {
          intentAdjustment += 0.04 * weight;
        }

        break;
      }

      case "battery": {
        const batteryTag = hasAnyTag(ctx.tags, [
          "battery",
          "large-battery",
          "large battery",
          "long-battery",
          "long battery",
          "long-lasting-battery",
          "long lasting battery",
          "battery backup",
          "long battery life",
        ]);

        const batterySignal =
          ctx.battery * 0.8 +
          ctx.rating * 0.2;

        intentAdjustment += batterySignal * weight * 0.18;

        if (batteryTag) {
          intentAdjustment += 0.035 * weight;
        }

        break;
      }

      case "balanced": {
        const balancedSignal =
          ctx.ram * 0.25 +
          ctx.cpu * 0.25 +
          ctx.battery * 0.2 +
          ctx.rating * 0.3;

        intentAdjustment += balancedSignal * weight * 0.05;

        break;
      }

      default:
        break;
    }
  }

  score.adjustment += intentAdjustment;

  score.breakdown.ram = percentage(ctx.ram);
  score.breakdown.processor = percentage(ctx.cpu);
  score.breakdown.battery = percentage(ctx.battery);
  score.breakdown.rating = percentage(ctx.rating);

  const brandBoost = BRAND_BOOST[ctx.brand] ?? 0;

  score.adjustment += brandBoost;
  score.breakdown.brand = percentage(brandBoost);

  let tagBoost = 0;

  for (const currentIntent of ctx.weightedIntent) {
    const weight = currentIntent.weight;

    if (
      currentIntent.type === "gaming" &&
      hasAnyTag(ctx.tags, [
        "gaming",
        "gaming phone",
        "game",
        "performance",
        "performance phone",
        "high performance",
        "high-performance",
      ])
    ) {
      tagBoost += 0.04 * weight;
    }

    if (
      currentIntent.type === "camera" &&
      hasAnyTag(ctx.tags, [
        "camera",
        "camera phone",
        "high-resolution-camera",
        "high resolution camera",
        "photography",
        "photography phone",
        "video",
        "video phone",
      ])
    ) {
      tagBoost += 0.04 * weight;
    }

    if (
      currentIntent.type === "battery" &&
      hasAnyTag(ctx.tags, [
        "battery",
        "large-battery",
        "large battery",
        "long-battery",
        "long battery",
        "long-lasting-battery",
        "long lasting battery",
        "battery backup",
        "long battery life",
      ])
    ) {
      tagBoost += 0.035 * weight;
    }
  }

  score.adjustment += tagBoost;
  score.breakdown.tags = percentage(tagBoost);

  const trust = calculateTrustScore(ctx.reviews);
  const trustBoost = clamp(trust * 0.1, 0, 0.1);

  score.adjustment += trustBoost;
  score.breakdown.trust = percentage(trustBoost);

  const value = calculateValueScore(
    processorScore,
    resolvedRamGb,
    ctx.price
  );

  const valueBoost = clamp(value * 3, 0, 0.06);

  score.adjustment += valueBoost;
  score.breakdown.value = percentage(valueBoost);

  if (
    budget !== null &&
    budget > 0 &&
    ctx.price >= MIN_VALID_PRICE
  ) {
    const utilization = ctx.price / budget;
    const priceBoost = calculatePriceFit(utilization);

    score.adjustment += priceBoost;
    score.breakdown.priceFit = percentage(priceBoost);
  }

  if (constraints) {
    const constraintAdjustment = calculateConstraintScore(
      product,
      constraints
    );

    score.adjustment += constraintAdjustment;
    score.breakdown.constraints = percentage(constraintAdjustment);
  }

  let tieBreaker = 0;

  tieBreaker += Math.log10(Math.max(ctx.reviews, 1)) * 0.012;
  tieBreaker += safeNumber(product.rating) * 0.006;
  tieBreaker += processorScore * 0.001;

  score.adjustment += tieBreaker;
  score.breakdown.tieBreaker = percentage(tieBreaker);

  score.adjustment = clamp(
    score.adjustment,
    MIN_ADJUSTMENT,
    MAX_ADJUSTMENT
  );

  const finalScore = clamp(
    score.core * FINAL_CORE_WEIGHT + score.adjustment,
    0,
    MAX_SCORE
  );

  const total = Math.round(Math.pow(finalScore, 1.25) * 100);

  score.breakdown.total = total;

  return {
    total,
    breakdown: {
      ram: score.breakdown.ram,
      processor: score.breakdown.processor,
      battery: score.breakdown.battery,
      rating: score.breakdown.rating,
      brand: score.breakdown.brand,
      tags: score.breakdown.tags,
      trust: score.breakdown.trust,
      value: score.breakdown.value,
      priceFit: score.breakdown.priceFit,
      constraints: score.breakdown.constraints,
      tieBreaker: score.breakdown.tieBreaker,
      total: score.breakdown.total,
    },
  };
}

function resolveProcessorScore(product: Product): number {
  const explicit = safeNumber(product.specs?.processorScore);

  if (explicit > 0) {
    return clamp(explicit, 0, PROCESSOR_MAX_SCORE);
  }

  const chipset = product.specs?.chipset;

  if (typeof chipset !== "string" || !chipset.trim()) {
    return 0;
  }

  return clamp(
    getProcessorScore(chipset),
    0,
    PROCESSOR_MAX_SCORE
  );
}

function getProcessorScore(chipset: string): number {
  const normalized = normalizeText(chipset);

  if (!normalized) {
    return 0;
  }

  const appleMatch = normalized.match(/\ba(\d+)\b/);

  if (appleMatch?.[1]) {
    const generation = Number(appleMatch[1]);

    if (Number.isFinite(generation)) {
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
      if (generation === 9) return 6.3;
      if (generation === 8) return 5.8;
      if (generation === 7) return 5.2;
    }
  }

  const snapdragonMatch = normalized.match(
    /snapdragon\s+([a-z0-9]+(?:\s+gen\s*\d+)?)/i
  );

  if (snapdragonMatch?.[1]) {
    const model = snapdragonMatch[1];
    const modelScore = getSnapdragonScore(model);

    if (modelScore !== null) {
      return modelScore;
    }
  }

  const dimensityMatch = normalized.match(
    /dimensity\s+(\d{3,5})/i
  );

  if (dimensityMatch?.[1]) {
    const model = Number(dimensityMatch[1]);

    if (Number.isFinite(model)) {
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
  }

  const exynosMatch = normalized.match(
    /exynos\s+(\d{3,4})/i
  );

  if (exynosMatch?.[1]) {
    const model = Number(exynosMatch[1]);

    if (Number.isFinite(model)) {
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
  }

  const helioMatch = normalized.match(
    /helio\s+([a-z])?(\d+)/i
  );

  if (helioMatch?.[2]) {
    const prefix = (helioMatch[1] ?? "").toLowerCase();
    const model = Number(helioMatch[2]);

    if (Number.isFinite(model)) {
      if (prefix === "g") {
        if (model >= 200) return 7;
        if (model >= 100) return 6.5;
        if (model >= 99) return 6.2;
        if (model >= 95) return 6;
        if (model >= 90) return 5.8;
        if (model >= 85) return 5.5;
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
  }

  const unisocMatch = normalized.match(
    /unisoc\s+([a-z0-9-]+)/i
  );

  if (unisocMatch?.[1]) {
    const model = unisocMatch[1];
    const numeric = model.match(/\d+/);

    if (numeric?.[0]) {
      const number = Number(numeric[0]);

      if (Number.isFinite(number)) {
        if (/^t\d+/i.test(model)) {
          if (number >= 900) return 6;
          if (number >= 800) return 5.5;
          if (number >= 700) return 5;
          if (number >= 600) return 4.5;
        }

        return 3.5;
      }
    }

    return 3.5;
  }

  const tensorMatch = normalized.match(
    /tensor\s+g?(\d+)/i
  );

  if (tensorMatch?.[1]) {
    const generation = Number(tensorMatch[1]);

    if (Number.isFinite(generation)) {
      if (generation >= 5) return 9;
      if (generation === 4) return 8.5;
      if (generation === 3) return 8;
      if (generation === 2) return 7.2;
      if (generation === 1) return 6.5;
    }
  }

  const kirinMatch = normalized.match(
    /kirin\s+(\d{3,4})/i
  );

  if (kirinMatch?.[1]) {
    const model = Number(kirinMatch[1]);

    if (Number.isFinite(model)) {
      if (model >= 9000) return 9.2;
      if (model >= 8000) return 8.2;
      if (model >= 7000) return 6.8;
      if (model >= 6000) return 5.8;
      if (model >= 5000) return 5;
    }
  }

  if (normalized.includes("snapdragon")) {
    if (
      normalized.includes("8 gen") ||
      normalized.includes("8s gen")
    ) {
      return 8.5;
    }

    if (normalized.includes("7 gen")) return 7.5;
    if (normalized.includes("6 gen")) return 6;
    if (normalized.includes("4 gen")) return 4.5;
  }

  return 0;
}

function getSnapdragonScore(model: string): number | null {
  const normalized = model
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");

  const eightS = normalized.match(/^8s\s+gen\s+(\d+)/);

  if (eightS?.[1]) {
    const generation = Number(eightS[1]);

    if (generation >= 4) return 9.3;
    if (generation === 3) return 9;
    if (generation === 2) return 8.6;
    if (generation === 1) return 8.2;
  }

  const eightGen = normalized.match(/^8\s+gen\s+(\d+)/);

  if (eightGen?.[1]) {
    const generation = Number(eightGen[1]);

    if (generation >= 5) return 10;
    if (generation === 4) return 9.8;
    if (generation === 3) return 9.5;
    if (generation === 2) return 9.1;
    if (generation === 1) return 8.7;
  }

  const sevenGen = normalized.match(/^7\s+gen\s+(\d+)/);

  if (sevenGen?.[1]) {
    const generation = Number(sevenGen[1]);

    if (generation >= 4) return 8.4;
    if (generation === 3) return 8.1;
    if (generation === 2) return 7.7;
    if (generation === 1) return 7.3;
  }

  const sevenPlusGen = normalized.match(
    /^7\+\s+gen\s+(\d+)/
  );

  if (sevenPlusGen?.[1]) {
    const generation = Number(sevenPlusGen[1]);

    if (generation >= 4) return 9;
    if (generation === 3) return 8.8;
    if (generation === 2) return 8.3;
  }

  const sixGen = normalized.match(/^6\s+gen\s+(\d+)/);

  if (sixGen?.[1]) {
    const generation = Number(sixGen[1]);

    if (generation >= 4) return 6.8;
    if (generation === 3) return 6.4;
    if (generation === 2) return 6;
    if (generation === 1) return 5.5;
  }

  const sixSeries = normalized.match(/^(\d{3})/);

  if (sixSeries?.[1]) {
    const series = Number(sixSeries[1]);

    if (series >= 695) return 5.4;
    if (series >= 690) return 5.2;
    if (series >= 680) return 5.2;
    if (series >= 675) return 5;
    if (series >= 662) return 4.8;
    if (series >= 660) return 4.6;
    if (series >= 600) return 4.2;
  }

  const fourGen = normalized.match(/^4\s+gen\s+(\d+)/);

  if (fourGen?.[1]) {
    const generation = Number(fourGen[1]);

    if (generation >= 3) return 5.2;
    if (generation === 2) return 4.8;
    if (generation === 1) return 4.4;
  }

  const numeric = normalized.match(/^(\d{3,4})/);

  if (numeric?.[1]) {
    const series = Number(numeric[1]);

    if (series >= 800) return 9;
    if (series >= 700) return 7.5;
    if (series >= 600) return 5;
    if (series >= 400) return 3.8;
  }

  return null;
}

function calculatePriceFit(utilization: number): number {
  if (!Number.isFinite(utilization) || utilization <= 0) {
    return 0;
  }

  if (utilization > 1.2) {
    return PRICE_OVER_BUDGET_PENALTY.severe;
  }

  if (utilization > 1.05) {
    return PRICE_OVER_BUDGET_PENALTY.high;
  }

  if (utilization > 1) {
    return PRICE_OVER_BUDGET_PENALTY.slight;
  }

  if (utilization >= 0.9) {
    return PRICE_WITHIN_BUDGET_BONUS.nearLimit;
  }

  if (utilization >= 0.75) {
    return PRICE_WITHIN_BUDGET_BONUS.upperRange;
  }

  if (utilization >= 0.55) {
    return PRICE_WITHIN_BUDGET_BONUS.middleRange;
  }

  if (utilization >= 0.35) {
    return PRICE_WITHIN_BUDGET_BONUS.lowerRange;
  }

  return PRICE_WITHIN_BUDGET_BONUS.deepDiscount;
}

function calculateConstraintScore(
  product: Product,
  constraints: Constraints
): number {
  let adjustment = 0;

  const ram = resolveRamGb(product);
  const battery = safeNumber(product.specs?.battery);
  const rating = safeNumber(product.rating);

  if (constraints.minRam != null) {
    adjustment += ram >= constraints.minRam ? 0.05 : -0.1;
  }

  if (constraints.maxRam != null) {
    adjustment += ram <= constraints.maxRam ? 0.025 : -0.05;
  }

  if (constraints.minBattery != null) {
    adjustment +=
      battery >= constraints.minBattery
        ? 0.04
        : -0.08;
  }

  if (constraints.maxBattery != null) {
    adjustment +=
      battery <= constraints.maxBattery
        ? 0.02
        : -0.04;
  }

  if (constraints.minRating != null) {
    adjustment +=
      rating >= constraints.minRating
        ? 0.04
        : -0.08;
  }

  if (constraints.maxRating != null) {
    adjustment +=
      rating <= constraints.maxRating
        ? 0.02
        : -0.04;
  }

  const price = safeNumber(product.price);

  if (constraints.minPrice != null) {
    adjustment +=
      price >= constraints.minPrice
        ? 0.03
        : -0.06;
  }

  if (constraints.maxPrice != null) {
    adjustment +=
      price <= constraints.maxPrice
        ? 0.04
        : -0.08;
  }

  if (constraints.preferredBrands?.length) {
    const brand = normalizeText(product.brand);

    const preferred = constraints.preferredBrands.some(
      (item) => normalizeText(item) === brand
    );

    adjustment += preferred ? 0.04 : -0.02;
  }

  if (constraints.excludedBrands?.length) {
    const brand = normalizeText(product.brand);

    const excluded = constraints.excludedBrands.some(
      (item) => normalizeText(item) === brand
    );

    if (excluded) {
      adjustment -= 0.12;
    }
  }

  if (constraints.requiredTags?.length) {
    const tags = normalizeTags(product.tags);

    const required = constraints.requiredTags
      .map(normalizeText)
      .filter(Boolean);

    const matched = required.filter(
      (tag) => tags.includes(tag)
    ).length;

    if (required.length > 0) {
      const ratio = matched / required.length;

      adjustment += ratio * 0.06;

      if (matched < required.length) {
        adjustment -= 0.04;
      }
    }
  }

  if (constraints.excludedTags?.length) {
    const tags = normalizeTags(product.tags);

    const excluded = constraints.excludedTags
      .map(normalizeText)
      .filter(Boolean);

    if (
      excluded.some((tag) => tags.includes(tag))
    ) {
      adjustment -= 0.1;
    }
  }

  return clamp(adjustment, -0.2, 0.15);
}

function normalizeIntent(
  intent: IntentType[] | WeightedIntent[]
): WeightedIntent[] {
  if (!Array.isArray(intent) || intent.length === 0) {
    return [
      {
        type: "balanced",
        weight: 1,
      },
    ];
  }

  if (typeof intent[0] === "string") {
    const types = (intent as IntentType[]).filter(isIntentType);

    if (types.length === 0) {
      return [
        {
          type: "balanced",
          weight: 1,
        },
      ];
    }

    const uniqueTypes = [...new Set(types)];
    const weight = 1 / uniqueTypes.length;

    return uniqueTypes.map((type) => ({
      type,
      weight,
    }));
  }

  const weighted = (intent as WeightedIntent[]).filter(
    (item): item is WeightedIntent =>
      Boolean(item) &&
      isIntentType(item.type) &&
      Number.isFinite(item.weight) &&
      item.weight > 0
  );

  if (weighted.length === 0) {
    return [
      {
        type: "balanced",
        weight: 1,
      },
    ];
  }

  const merged = new Map<IntentType, number>();

  for (const item of weighted) {
    merged.set(
      item.type,
      (merged.get(item.type) ?? 0) + item.weight
    );
  }

  const totalWeight = [...merged.values()].reduce(
    (sum, weight) => sum + weight,
    0
  );

  if (totalWeight <= 0) {
    return [
      {
        type: "balanced",
        weight: 1,
      },
    ];
  }

  return [...merged.entries()].map(
    ([type, weight]) => ({
      type,
      weight: weight / totalWeight,
    })
  );
}

function isIntentType(
  value: unknown
): value is IntentType {
  return (
    value === "gaming" ||
    value === "camera" ||
    value === "battery" ||
    value === "balanced"
  );
}

function hasAnyTag(
  tags: string[],
  candidates: string[]
): boolean {
  const normalizedCandidates = candidates
    .map(normalizeText)
    .filter(Boolean);

  return normalizedCandidates.some(
    (candidate) => tags.includes(candidate)
  );
}

function normalizeText(
  value: unknown
): string {
  if (typeof value !== "string") {
    return "";
  }

  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function normalizeTags(
  values: unknown
): string[] {
  if (!Array.isArray(values)) {
    return [];
  }

  return [
    ...new Set(
      values
        .filter(
          (value): value is string =>
            typeof value === "string"
        )
        .map(normalizeText)
        .filter(Boolean)
    ),
  ];
}

function safeNumber(
  value: unknown
): number {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }

  if (typeof value !== "string") {
    return 0;
  }

  const normalized = value
    .trim()
    .replace(/,/g, "");

  if (!normalized) {
    return 0;
  }

  const direct = Number(normalized);

  if (Number.isFinite(direct)) {
    return direct;
  }

  const match = normalized.match(
    /[-+]?\d+(?:\.\d+)?/
  );

  if (!match?.[0]) {
    return 0;
  }

  const parsed = Number(match[0]);

  return Number.isFinite(parsed)
    ? parsed
    : 0;
}

function resolveRamGb(
  product: Product
): number {
  const specRam = parseRamGb(product.specs?.ram);

  if (specRam > 0) {
    return clampRam(specRam);
  }

  const name = normalizeText(product.name);

  if (!name) {
    return 0;
  }

  const explicitPatterns = [
    /(?:ram|memory)\s*[:\-]?\s*(\d+(?:\.\d+)?)\s*gb\b/i,
    /(\d+(?:\.\d+)?)\s*gb\s*(?:ram|memory)\b/i,
  ];

  for (const pattern of explicitPatterns) {
    const match = name.match(pattern);

    if (match?.[1]) {
      const ram = Number(match[1]);

      if (
        Number.isFinite(ram) &&
        ram > 0 &&
        ram <= 64
      ) {
        return ram;
      }
    }
  }

  const capacities = [
    ...name.matchAll(
      /(\d+(?:\.\d+)?)\s*gb\b/gi
    ),
  ]
    .map((match) => Number(match[1]))
    .filter(
      (value) =>
        Number.isFinite(value) &&
        value > 0
    );

  if (capacities.length >= 2) {
    const candidates = capacities
      .slice(0, 4)
      .filter((value) => value <= 64);

    const ram = candidates.find(
      (value) =>
        capacities.some(
          (other) => other > value
        )
    );

    if (ram !== undefined) {
      return ram;
    }
  }

  if (
    capacities.length === 1 &&
    capacities[0] <= 64
  ) {
    const context = name.replace(
      /\b(\d+(?:\.\d+)?)\s*gb\b/gi,
      " "
    );

    if (
      /\b(ram|memory|lpddr|ddr)\b/i.test(
        context
      )
    ) {
      return capacities[0];
    }
  }

  return 0;
}

function clampRam(
  value: number
): number {
  if (
    !Number.isFinite(value) ||
    value <= 0
  ) {
    return 0;
  }

  return Math.min(value, 64);
}

function parseRamGb(
  value: unknown
): number {
  if (typeof value === "number") {
    return Number.isFinite(value) &&
      value > 0 &&
      value <= 64
      ? value
      : 0;
  }

  if (typeof value !== "string") {
    return 0;
  }

  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/,/g, "")
    .replace(/\s+/g, " ");

  if (!normalized) {
    return 0;
  }

  const explicitMatch = normalized.match(
    /(?:ram|memory)\s*[:\-]?\s*(\d+(?:\.\d+)?)\s*gb\b|\b(\d+(?:\.\d+)?)\s*gb\s*(?:ram|memory)\b/i
  );

  if (explicitMatch) {
    const parsed = Number(
      explicitMatch[1] ??
      explicitMatch[2]
    );

    if (
      Number.isFinite(parsed) &&
      parsed > 0 &&
      parsed <= 64
    ) {
      return parsed;
    }
  }

  const capacities = [
    ...normalized.matchAll(
      /(\d+(?:\.\d+)?)\s*gb\b/gi
    ),
  ]
    .map((match) => Number(match[1]))
    .filter(
      (value) =>
        Number.isFinite(value) &&
        value > 0
    );

  if (capacities.length >= 2) {
    const ram = capacities.find(
      (value, index) =>
        value <= 64 &&
        capacities.some(
          (other, otherIndex) =>
            otherIndex !== index &&
            other > value
        )
    );

    if (ram !== undefined) {
      return ram;
    }
  }

  if (
    capacities.length === 1 &&
    capacities[0] <= 64 &&
    /\b(ram|memory|lpddr|ddr)\b/i.test(
      normalized
    )
  ) {
    return capacities[0];
  }

  return 0;
}

function percentage(
  value: number
): number {
  return Math.round(
    clamp(value, -1, 1) * 100
  );
}

function clamp(
  value: number,
  min: number,
  max: number
): number {
  if (!Number.isFinite(value)) {
    return min;
  }

  return Math.min(
    max,
    Math.max(min, value)
  );
}