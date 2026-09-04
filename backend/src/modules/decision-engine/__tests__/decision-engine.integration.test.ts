import { describe, expect, it } from "vitest";
import { runEngine } from "../engine/runEngine";
import { parseQuery } from "../parser/queryParser";
import { Product } from "../types";

function createProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: "product-1",
    name: "Test Smartphone",
    brand: "TestBrand",
    category: "smartphone",
    description: "A reliable smartphone with strong overall performance.",
    price: 29999,
    rating: 4.5,
    reviewsCount: 1000,
    images: ["https://example.com/product.jpg"],
    tags: ["5g"],
    highlights: ["Strong performance"],
    weaknesses: [],
    specs: {
      ram: 12,
      storage: 256,
      battery: 6000,
      processorScore: 90,
      cameraMp: 50,
    },
    ...overrides,
  };
}

function execute(query: string, products: Product[]) {
  return runEngine(parseQuery(query), products);
}

function expectValidScore(score: unknown): asserts score is number {
  expect(typeof score).toBe("number");
  expect(Number.isFinite(score)).toBe(true);
  expect(score).toBeGreaterThanOrEqual(0);
  expect(score).toBeLessThanOrEqual(100);
}

function expectValidProduct(product: Product | null): asserts product is Product {
  expect(product).not.toBeNull();
  expect(product).toBeDefined();
  expect(product!.id).toBeTruthy();
  expectValidScore(product!.score);
}

describe("Decision Engine integration", () => {
  it("processes a complete product recommendation flow", () => {
    const products = [
      createProduct({ id: "alpha", name: "Alpha Phone", price: 29999 }),
      createProduct({
        id: "beta",
        name: "Beta Phone",
        price: 39999,
        specs: {
          ram: 8,
          storage: 128,
          battery: 5000,
          processorScore: 80,
          cameraMp: 40,
        },
      }),
    ];

    const result = execute("best phone under 50000", products);

    expectValidProduct(result.best);
    expect(result.best.id).toBe("alpha");
    expect(result.parsed.category).toBe("smartphone");
    expect(result.parsed.budget).toBe(50000);
    expect(result.recommendations).toEqual(expect.any(Array));
    expect(result.notRecommended).toEqual(expect.any(Array));
    expect(result.suggestions).toEqual(expect.any(Array));
    expect(result.metadata).toEqual(expect.objectContaining({
      version: expect.any(String),
      executionTime: expect.any(Number),
      fallbackLevel: expect.any(Number),
      appliedRules: expect.any(Array),
      timestamp: expect.any(Number),
    }));
  });

  it("detects gaming intent and ranks gaming-capable products", () => {
    const gamingProduct = createProduct({
      id: "gaming",
      name: "Gaming Phone",
      specs: {
        ram: 16,
        storage: 512,
        battery: 6500,
        processorScore: 99,
        cameraMp: 50,
      },
      tags: ["gaming", "high-performance"],
    });

    const balancedProduct = createProduct({
      id: "balanced",
      name: "Balanced Phone",
      specs: {
        ram: 8,
        storage: 128,
        battery: 5000,
        processorScore: 70,
        cameraMp: 50,
      },
      tags: [],
    });

    const result = execute("best gaming phone", [balancedProduct, gamingProduct]);

    expect(result.parsed.intent).toContain("gaming");
    expectValidProduct(result.best);
    expect(result.best.id).toBe("gaming");
  });

  it("detects camera intent and ranks camera-capable products", () => {
    const cameraProduct = createProduct({
      id: "camera",
      name: "Camera Phone",
      specs: {
        ram: 12,
        storage: 256,
        battery: 5500,
        processorScore: 85,
        cameraMp: 200,
      },
      tags: ["high-resolution-camera"],
    });

    const standardProduct = createProduct({
      id: "standard",
      name: "Standard Phone",
      specs: {
        ram: 12,
        storage: 256,
        battery: 5500,
        processorScore: 85,
        cameraMp: 48,
      },
      tags: [],
    });

    const result = execute("best camera phone", [standardProduct, cameraProduct]);

    expect(result.parsed.intent).toContain("camera");
    expectValidProduct(result.best);
    expect(result.best.id).toBe("camera");
  });

  it("detects battery intent and ranks high-battery products", () => {
    const batteryProduct = createProduct({
      id: "battery",
      name: "Long Battery Phone",
      specs: {
        ram: 12,
        storage: 256,
        battery: 9000,
        processorScore: 85,
        cameraMp: 50,
      },
      tags: ["large-battery"],
    });

    const standardProduct = createProduct({
      id: "standard",
      name: "Standard Battery Phone",
      specs: {
        ram: 12,
        storage: 256,
        battery: 4500,
        processorScore: 85,
        cameraMp: 50,
      },
      tags: [],
    });

    const result = execute("best battery phone", [standardProduct, batteryProduct]);

    expect(result.parsed.intent).toContain("battery");
    expectValidProduct(result.best);
    expect(result.best.id).toBe("battery");
  });

  it("enforces the detected budget through the filtering pipeline", () => {
    const affordable = createProduct({ id: "affordable", price: 19999 });
    const expensive = createProduct({ id: "expensive", price: 90000 });

    const result = execute("best phone under 30000", [expensive, affordable]);

    expect(result.parsed.budget).toBe(30000);
    expectValidProduct(result.best);
    expect(result.best.id).toBe("affordable");
    expect(result.best.price).toBeLessThanOrEqual(30000);
  });

  it("enforces RAM constraints before ranking", () => {
    const lowRam = createProduct({
      id: "low-ram",
      specs: {
        ram: 6,
        storage: 256,
        battery: 6000,
        processorScore: 95,
        cameraMp: 50,
      },
    });

    const highRam = createProduct({
      id: "high-ram",
      specs: {
        ram: 12,
        storage: 256,
        battery: 6000,
        processorScore: 90,
        cameraMp: 50,
      },
    });

    const result = execute("best phone 12gb ram", [lowRam, highRam]);

    expect(result.parsed.constraints?.minRam).toBe(12);
    expectValidProduct(result.best);
    expect(result.best.id).toBe("high-ram");
  });

  it("enforces battery constraints before ranking", () => {
    const lowBattery = createProduct({
      id: "low-battery",
      specs: {
        ram: 12,
        storage: 256,
        battery: 5000,
        processorScore: 99,
        cameraMp: 50,
      },
    });

    const highBattery = createProduct({
      id: "high-battery",
      specs: {
        ram: 12,
        storage: 256,
        battery: 7000,
        processorScore: 90,
        cameraMp: 50,
      },
    });

    const result = execute("best phone 6500mah", [lowBattery, highBattery]);

    expect(result.parsed.constraints?.minBattery).toBe(6500);
    expectValidProduct(result.best);
    expect(result.best.id).toBe("high-battery");
  });

  it("returns recommendations separately from the best product", () => {
    const products = [
      createProduct({ id: "1", price: 20000, rating: 4.8, reviewsCount: 5000 }),
      createProduct({ id: "2", price: 22000, rating: 4.6, reviewsCount: 3000 }),
      createProduct({ id: "3", price: 24000, rating: 4.5, reviewsCount: 2000 }),
      createProduct({ id: "4", price: 26000, rating: 4.3, reviewsCount: 1000 }),
    ];

    const result = execute("best phone under 30000", products);

    expectValidProduct(result.best);
    expect(result.recommendations.length).toBeGreaterThan(0);

    const returnedIds = [result.best.id, ...result.recommendations.map((product) => product.id)];

    expect(new Set(returnedIds).size).toBe(returnedIds.length);
    expect(result.recommendations.some((product) => product.id === result.best?.id)).toBe(false);

    for (const product of result.recommendations) {
      expectValidScore(product.score);
    }
  });

  it("generates comparison data when multiple ranked products exist", () => {
    const products = [
      createProduct({
        id: "1",
        name: "Alpha Phone",
        price: 25000,
        rating: 4.7,
        reviewsCount: 3000,
      }),
      createProduct({
        id: "2",
        name: "Beta Phone",
        price: 28000,
        rating: 4.5,
        reviewsCount: 2000,
      }),
    ];

    const result = execute("best phone under 30000", products);

    expectValidProduct(result.best);
    expect(result.comparison).toBeDefined();
    expect(result.comparison).not.toBeNull();
  });

  it("includes generated explanation and confidence for the best product", () => {
    const product = createProduct({
      id: "best",
      name: "Premium Phone",
    });

    const result = execute("best phone under 50000", [product]);

    expectValidProduct(result.best);
    expect(result.best.explanation).toEqual(expect.any(String));
    expect(result.best.explanation!.length).toBeGreaterThan(0);
    expect(result.best.confidence).toEqual(expect.any(Number));
    expect(result.best.confidence).toBeGreaterThanOrEqual(0);
    expect(result.best.confidence).toBeLessThanOrEqual(100);
  });

  it("keeps confidence within the production-safe range", () => {
    const products = [
      createProduct({
        id: "1",
        rating: 4.8,
        reviewsCount: 10000,
      }),
      createProduct({
        id: "2",
        rating: 3.5,
        reviewsCount: 10,
      }),
    ];

    const result = execute("best phone under 50000", products);

    expectValidProduct(result.best);
    expect(result.best.confidence).toBeGreaterThanOrEqual(0);
    expect(result.best.confidence).toBeLessThanOrEqual(100);
    expect(result.confidence).toBeGreaterThanOrEqual(0);
    expect(result.confidence).toBeLessThanOrEqual(100);

    for (const product of result.recommendations) {
      expect(product.confidence).toBeGreaterThanOrEqual(0);
      expect(product.confidence).toBeLessThanOrEqual(100);
    }
  });

  it("keeps the final decision deterministic", () => {
    const products = [
      createProduct({
        id: "1",
        price: 25000,
        rating: 4.7,
        reviewsCount: 3000,
      }),
      createProduct({
        id: "2",
        price: 28000,
        rating: 4.5,
        reviewsCount: 2000,
      }),
      createProduct({
        id: "3",
        price: 22000,
        rating: 4.4,
        reviewsCount: 1500,
      }),
    ];

    const first = execute("best phone under 30000", products);
    const second = execute("best phone under 30000", products);

    expectValidProduct(first.best);
    expectValidProduct(second.best);
    expect(first.best.id).toBe(second.best.id);
    expect(first.best.score).toBe(second.best.score);
    expect(first.recommendations.map((product) => product.id)).toEqual(second.recommendations.map((product) => product.id));
  });

  it("handles an empty product catalog without throwing", () => {
    const result = execute("best phone under 30000", []);

    expect(result.best).toBeNull();
    expect(result.recommendations).toEqual([]);
    expect(result.notRecommended).toEqual([]);
    expect(result.suggestions).toEqual(expect.any(Array));
    expect(result.comparison).toBeDefined();
    expect(result.confidence).toBeGreaterThanOrEqual(0);
    expect(result.confidence).toBeLessThanOrEqual(100);
  });

  it("handles sparse products without producing invalid scores", () => {
    const sparseProduct = createProduct({
      id: "sparse",
      name: "",
      description: "",
      price: 0,
      rating: 0,
      reviewsCount: 0,
      images: [],
      tags: [],
      highlights: [],
      weaknesses: [],
      specs: {},
    });

    const result = execute("best phone", [sparseProduct]);

    expectValidProduct(result.best);
    expectValidScore(result.best.score);
  });

  it("supports weighted intent input through the parsed decision flow", () => {
    const gamingProduct = createProduct({
      id: "gaming",
      specs: {
        ram: 16,
        storage: 512,
        battery: 6500,
        processorScore: 99,
        cameraMp: 50,
      },
      tags: ["gaming"],
    });

    const cameraProduct = createProduct({
      id: "camera",
      specs: {
        ram: 12,
        storage: 512,
        battery: 6000,
        processorScore: 85,
        cameraMp: 200,
      },
      tags: ["high-resolution-camera"],
    });

    const result = execute("best gaming camera phone", [cameraProduct, gamingProduct]);

    expect(result.parsed.weightedIntent).toBeDefined();
    expect(result.parsed.weightedIntent?.length).toBeGreaterThan(0);
    expectValidProduct(result.best);
  });

  it("preserves parsed query information in the final decision", () => {
    const result = execute("best phone under 50000 for gaming", [
      createProduct({
        id: "gaming",
        price: 45000,
        tags: ["gaming"],
      }),
    ]);

    expect(result.parsed.category).toBe("smartphone");
    expect(result.parsed.budget).toBe(50000);
    expect(result.parsed.intent).toContain("gaming");
  });

  it("returns a complete production engine result contract", () => {
    const result = execute("best phone under 50000", [
      createProduct({ id: "1" }),
      createProduct({ id: "2", price: 40000 }),
    ]);

    expect(result).toEqual(expect.objectContaining({
      best: expect.anything(),
      recommendations: expect.any(Array),
      notRecommended: expect.any(Array),
      comparison: expect.anything(),
      parsed: expect.any(Object),
      isRelaxed: expect.any(Boolean),
      confidence: expect.any(Number),
      suggestions: expect.any(Array),
      metadata: expect.objectContaining({
        version: expect.any(String),
        executionTime: expect.any(Number),
        fallbackLevel: expect.any(Number),
        appliedRules: expect.any(Array),
        timestamp: expect.any(Number),
      }),
    }));

    expect(result.metadata.executionTime).toBeGreaterThanOrEqual(0);
  });

  it("never returns a score outside the decision-engine contract", () => {
    const products = Array.from({ length: 20 }, (_, index) =>
      createProduct({
        id: `product-${index}`,
        price: 15000 + index * 2000,
        rating: 3 + (index % 3) * 0.5,
        reviewsCount: index * 100,
        specs: {
          ram: 4 + (index % 4) * 4,
          storage: 128 + (index % 3) * 128,
          battery: 4000 + (index % 5) * 500,
          processorScore: 50 + (index % 6) * 10,
          cameraMp: 32 + (index % 5) * 20,
        },
      })
    );

    const result = execute("best phone under 60000", products);

    expectValidProduct(result.best);

    for (const product of [result.best, ...result.recommendations]) {
      expectValidScore(product.score);
    }
  });

  it("does not mutate the original product catalog", () => {
    const products = [
      createProduct({
        id: "1",
        price: 25000,
        specs: {
          ram: 12,
          storage: 256,
          battery: 6000,
          processorScore: 90,
          cameraMp: 50,
        },
      }),
      createProduct({
        id: "2",
        price: 30000,
        specs: {
          ram: 8,
          storage: 128,
          battery: 5000,
          processorScore: 80,
          cameraMp: 48,
        },
      }),
    ];

    const snapshot = structuredClone(products);

    execute("best phone under 50000", products);

    expect(products).toEqual(snapshot);
  });

  it("exposes fallback metadata when the engine relaxes constraints", () => {
    const products = [
      createProduct({
        id: "fallback-product",
        price: 60000,
        specs: {
          ram: 12,
          storage: 256,
          battery: 6000,
          processorScore: 90,
          cameraMp: 50,
        },
      }),
    ];

    const result = execute("best phone under 30000", products);

    expect(result.metadata.fallbackLevel).toBeGreaterThanOrEqual(0);
    expect(result.metadata.fallbackLevel).toBeLessThanOrEqual(2);
    expect(result.metadata.appliedRules).toEqual(expect.any(Array));
    expect(typeof result.isRelaxed).toBe("boolean");
  });
});