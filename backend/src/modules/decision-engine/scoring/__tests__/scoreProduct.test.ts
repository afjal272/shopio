import { describe, expect, it } from "vitest";
import { scoreProduct } from "../scoreProduct";
import { Product } from "../../types";

function createProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: "test-product",
    name: "Test Smartphone 12GB 256GB",
    brand: "Samsung",
    category: "smartphone",
    description: "High performance smartphone with excellent battery and camera.",
    price: 59999,
    rating: 4.5,
    reviewsCount: 5000,
    images: [],
    tags: ["gaming", "camera", "battery"],
    highlights: ["12GB RAM", "256GB Storage", "5000mAh Battery", "50MP Camera"],
    weaknesses: [],
    specs: {
      ram: 12,
      storage: 256,
      battery: 5000,
      processorScore: 8.5,
      cameraMp: 50,
    },
    ...overrides,
  };
}

describe("scoreProduct", () => {
  it("returns a valid score between 0 and 100", () => {
    const result = scoreProduct(createProduct(), ["balanced"], null);

    expect(result.total).toBeGreaterThanOrEqual(0);
    expect(result.total).toBeLessThanOrEqual(100);
  });

  it("returns a complete score breakdown", () => {
    const result = scoreProduct(createProduct(), ["balanced"], null);

    expect(result.breakdown).toBeDefined();
    expect(result.breakdown.ram).toBeGreaterThanOrEqual(0);
    expect(result.breakdown.ram).toBeLessThanOrEqual(100);
    expect(result.breakdown.processor).toBeGreaterThanOrEqual(0);
    expect(result.breakdown.processor).toBeLessThanOrEqual(100);
    expect(result.breakdown.battery).toBeGreaterThanOrEqual(0);
    expect(result.breakdown.battery).toBeLessThanOrEqual(100);
    expect(result.breakdown.rating).toBeGreaterThanOrEqual(0);
    expect(result.breakdown.rating).toBeLessThanOrEqual(100);
    expect(result.breakdown.total).toBe(result.total);
  });

  it("does not produce NaN or Infinity", () => {
    const result = scoreProduct(createProduct(), ["balanced"], null);

    expect(Number.isFinite(result.total)).toBe(true);

    for (const value of Object.values(result.breakdown)) {
      expect(Number.isFinite(value)).toBe(true);
    }
  });

  it("recognizes RAM from product specifications", () => {
    const result = scoreProduct(
      createProduct({
        specs: {
          ram: 12,
          storage: 256,
          battery: 5000,
          processorScore: 8,
          cameraMp: 50,
        },
      }),
      ["balanced"],
      null,
    );

    expect(result.breakdown.ram).toBeGreaterThan(0);
  });

  it("recognizes RAM from product text when structured RAM is unavailable", () => {
    const result = scoreProduct(
      createProduct({
        name: "Flagship Smartphone 12GB 512GB",
        specs: {
          storage: 512,
          battery: 5000,
          processorScore: 8,
          cameraMp: 50,
        },
      }),
      ["balanced"],
      null,
    );

    expect(result.breakdown.ram).toBeGreaterThan(0);
  });

  it("does not confuse storage with RAM", () => {
    const result = scoreProduct(
      createProduct({
        name: "Smartphone 512GB Storage",
        specs: {
          storage: 512,
          battery: 5000,
          processorScore: 8,
          cameraMp: 50,
        },
        highlights: ["512GB Storage", "5000mAh Battery"],
      }),
      ["balanced"],
      null,
    );

    expect(result.breakdown.ram).toBeGreaterThanOrEqual(0);
    expect(result.breakdown.ram).toBeLessThan(100);
  });

  it("gives gaming-focused products meaningful processor influence", () => {
    const highPerformance = createProduct({
      specs: {
        ram: 12,
        storage: 256,
        battery: 5000,
        processorScore: 9.5,
        cameraMp: 50,
      },
    });

    const lowPerformance = createProduct({
      specs: {
        ram: 12,
        storage: 256,
        battery: 5000,
        processorScore: 5,
        cameraMp: 50,
      },
    });

    const highScore = scoreProduct(highPerformance, ["gaming"], null);
    const lowScore = scoreProduct(lowPerformance, ["gaming"], null);

    expect(highScore.total).toBeGreaterThan(lowScore.total);
    expect(highScore.breakdown.processor).toBeGreaterThan(lowScore.breakdown.processor);
  });

  it("gives camera-focused products meaningful camera influence", () => {
    const strongCamera = createProduct({
      specs: {
        ram: 8,
        storage: 256,
        battery: 5000,
        processorScore: 7,
        cameraMp: 200,
      },
    });

    const weakerCamera = createProduct({
      specs: {
        ram: 8,
        storage: 256,
        battery: 5000,
        processorScore: 7,
        cameraMp: 50,
      },
    });

    const strongScore = scoreProduct(strongCamera, ["camera"], null);
    const weakScore = scoreProduct(weakerCamera, ["camera"], null);

    expect(strongScore.total).toBeGreaterThan(weakScore.total);
    expect(strongScore.breakdown.ram).toBe(weakScore.breakdown.ram);
  });

  it("gives battery-focused products meaningful battery influence", () => {
    const largeBattery = createProduct({
      specs: {
        ram: 8,
        storage: 256,
        battery: 7000,
        processorScore: 7,
        cameraMp: 50,
      },
    });

    const smallerBattery = createProduct({
      specs: {
        ram: 8,
        storage: 256,
        battery: 4000,
        processorScore: 7,
        cameraMp: 50,
      },
    });

    const largeBatteryScore = scoreProduct(largeBattery, ["battery"], null);
    const smallerBatteryScore = scoreProduct(smallerBattery, ["battery"], null);

    expect(largeBatteryScore.total).toBeGreaterThan(smallerBatteryScore.total);
    expect(largeBatteryScore.breakdown.battery).toBeGreaterThan(smallerBatteryScore.breakdown.battery);
  });

  it("respects minimum RAM constraints", () => {
    const highRam = createProduct({
      specs: {
        ram: 12,
        storage: 256,
        battery: 5000,
        processorScore: 8,
        cameraMp: 50,
      },
    });

    const lowRam = createProduct({
      specs: {
        ram: 4,
        storage: 256,
        battery: 5000,
        processorScore: 8,
        cameraMp: 50,
      },
    });

    const highRamScore = scoreProduct(highRam, ["balanced"], null, {
      minRam: 8,
    });

    const lowRamScore = scoreProduct(lowRam, ["balanced"], null, {
      minRam: 8,
    });

    expect(highRamScore.total).toBeGreaterThan(lowRamScore.total);
    expect(highRamScore.breakdown.constraints).toBeGreaterThan(lowRamScore.breakdown.constraints);
  });

  it("respects minimum battery constraints", () => {
    const highBattery = createProduct({
      specs: {
        ram: 8,
        storage: 256,
        battery: 6000,
        processorScore: 7,
        cameraMp: 50,
      },
    });

    const lowBattery = createProduct({
      specs: {
        ram: 8,
        storage: 256,
        battery: 4000,
        processorScore: 7,
        cameraMp: 50,
      },
    });

    const highBatteryScore = scoreProduct(highBattery, ["battery"], null, {
      minBattery: 5000,
    });

    const lowBatteryScore = scoreProduct(lowBattery, ["battery"], null, {
      minBattery: 5000,
    });

    expect(highBatteryScore.total).toBeGreaterThan(lowBatteryScore.total);
    expect(highBatteryScore.breakdown.constraints).toBeGreaterThanOrEqual(lowBatteryScore.breakdown.constraints);
  });

  it("respects minimum rating constraints", () => {
    const highRating = createProduct({
      rating: 4.7,
    });

    const lowRating = createProduct({
      rating: 3.8,
    });

    const highRatingScore = scoreProduct(highRating, ["balanced"], null, {
      minRating: 4.5,
    });

    const lowRatingScore = scoreProduct(lowRating, ["balanced"], null, {
      minRating: 4.5,
    });

    expect(highRatingScore.total).toBeGreaterThan(lowRatingScore.total);
    expect(highRatingScore.breakdown.constraints).toBeGreaterThan(lowRatingScore.breakdown.constraints);
  });

  it("penalizes products that exceed the requested budget", () => {
    const withinBudget = createProduct({
      price: 80000,
    });

    const overBudget = createProduct({
      price: 120000,
    });

    const withinBudgetScore = scoreProduct(withinBudget, ["balanced"], 100000);
    const overBudgetScore = scoreProduct(overBudget, ["balanced"], 100000);

    expect(withinBudgetScore.breakdown.priceFit).toBeGreaterThan(overBudgetScore.breakdown.priceFit);
    expect(withinBudgetScore.total).toBeGreaterThan(overBudgetScore.total);
  });

  it("handles a null budget without applying price-fit penalties", () => {
    const result = scoreProduct(createProduct(), ["balanced"], null);

    expect(result.breakdown.priceFit).toBe(0);
    expect(Number.isFinite(result.total)).toBe(true);
  });

  it("handles products with missing specifications safely", () => {
    const result = scoreProduct(
      createProduct({
        specs: {},
        tags: [],
        highlights: [],
      }),
      ["balanced"],
      null,
    );

    expect(Number.isFinite(result.total)).toBe(true);
    expect(result.total).toBeGreaterThanOrEqual(0);
    expect(result.total).toBeLessThanOrEqual(100);
  });

  it("handles completely sparse product data safely", () => {
    const result = scoreProduct(
      createProduct({
        name: "Basic Product",
        description: "",
        price: 10000,
        rating: 0,
        reviewsCount: 0,
        tags: [],
        highlights: [],
        specs: {},
      }),
      ["balanced"],
      null,
    );

    expect(Number.isFinite(result.total)).toBe(true);
    expect(result.total).toBeGreaterThanOrEqual(0);
    expect(result.total).toBeLessThanOrEqual(100);
  });

  it("supports weighted intents", () => {
    const gamingProduct = createProduct({
      specs: {
        ram: 16,
        storage: 512,
        battery: 5000,
        processorScore: 9.8,
        cameraMp: 50,
      },
    });

    const cameraProduct = createProduct({
      specs: {
        ram: 8,
        storage: 256,
        battery: 5000,
        processorScore: 7,
        cameraMp: 200,
      },
    });

    const gamingWeighted = scoreProduct(
      gamingProduct,
      [
        { type: "gaming", weight: 0.8 },
        { type: "camera", weight: 0.2 },
      ],
      null,
    );

    const cameraWeighted = scoreProduct(
      cameraProduct,
      [
        { type: "gaming", weight: 0.2 },
        { type: "camera", weight: 0.8 },
      ],
      null,
    );

    expect(gamingWeighted.total).toBeGreaterThanOrEqual(0);
    expect(gamingWeighted.total).toBeLessThanOrEqual(100);
    expect(cameraWeighted.total).toBeGreaterThanOrEqual(0);
    expect(cameraWeighted.total).toBeLessThanOrEqual(100);
  });

  it("produces deterministic results for identical input", () => {
    const product = createProduct();

    const first = scoreProduct(product, ["gaming"], 100000, {
      minRam: 8,
      minBattery: 4500,
      minRating: 4,
    });

    const second = scoreProduct(product, ["gaming"], 100000, {
      minRam: 8,
      minBattery: 4500,
      minRating: 4,
    });

    expect(second).toEqual(first);
  });

  it("keeps all breakdown values within their expected range", () => {
    const result = scoreProduct(createProduct(), ["balanced"], null);

    const percentageFields = [
      result.breakdown.ram,
      result.breakdown.processor,
      result.breakdown.battery,
      result.breakdown.rating,
      result.breakdown.brand,
      result.breakdown.tags,
      result.breakdown.trust,
      result.breakdown.value,
      result.breakdown.priceFit,
      result.breakdown.constraints,
      result.breakdown.tieBreaker,
      result.breakdown.total,
    ];

    for (const value of percentageFields) {
      expect(Number.isFinite(value)).toBe(true);
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThanOrEqual(100);
    }
  });
});