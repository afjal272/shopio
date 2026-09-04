import { beforeEach, describe, expect, it, vi } from "vitest";
import { Product } from "../../types";

const mocks = vi.hoisted(() => ({
  scoreProduct: vi.fn(),
  calculateConfidence: vi.fn(),
  optimizeProduct: vi.fn(),
  sortProducts: vi.fn(),
}));

vi.mock("../../scoring/scoreProduct", () => ({
  scoreProduct: mocks.scoreProduct,
}));

vi.mock("../confidence", () => ({
  calculateConfidence: mocks.calculateConfidence,
}));

vi.mock("../../engine/optimizer", () => ({
  optimizeProduct: mocks.optimizeProduct,
}));

vi.mock("../sortProducts", () => ({
  sortProducts: mocks.sortProducts,
}));

import { rankProducts } from "../rankProducts";

function createProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: "product-1",
    name: "Test Smartphone",
    brand: "Samsung",
    category: "smartphone",
    description: "Test product",
    price: 59999,
    rating: 4.5,
    reviewsCount: 5000,
    images: [],
    tags: [],
    highlights: [],
    weaknesses: [],
    specs: {
      ram: 12,
      storage: 256,
      battery: 5000,
      processorScore: 8,
      cameraMp: 50,
    },
    ...overrides,
  };
}

describe("rankProducts", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mocks.scoreProduct.mockImplementation((product: Product) => ({
      total: product.id === "product-1" ? 82 : 74,
      breakdown: {
        ram: 75,
        processor: 80,
        battery: 83,
        rating: 90,
        total: product.id === "product-1" ? 82 : 74,
      },
    }));

    mocks.calculateConfidence.mockImplementation(
      (score: number) => Math.min(100, Math.max(0, Math.round(score))),
    );

    mocks.optimizeProduct.mockImplementation((product: Product) => product);

    mocks.sortProducts.mockImplementation((products: Product[]) =>
      [...products].sort((a, b) => (b.score ?? 0) - (a.score ?? 0)),
    );
  });

  it("returns an empty array when no products are provided", () => {
    const result = rankProducts([], ["balanced"], null);

    expect(result).toEqual([]);
    expect(mocks.scoreProduct).not.toHaveBeenCalled();
    expect(mocks.calculateConfidence).not.toHaveBeenCalled();
    expect(mocks.optimizeProduct).not.toHaveBeenCalled();
    expect(mocks.sortProducts).toHaveBeenCalledTimes(1);
  });

  it("scores every product exactly once", () => {
    const products = [
      createProduct({ id: "product-1" }),
      createProduct({ id: "product-2" }),
      createProduct({ id: "product-3" }),
    ];

    rankProducts(products, ["balanced"], null);

    expect(mocks.scoreProduct).toHaveBeenCalledTimes(products.length);
    expect(mocks.scoreProduct).toHaveBeenNthCalledWith(
      1,
      products[0],
      ["balanced"],
      null,
      undefined,
    );
    expect(mocks.scoreProduct).toHaveBeenNthCalledWith(
      2,
      products[1],
      ["balanced"],
      null,
      undefined,
    );
    expect(mocks.scoreProduct).toHaveBeenNthCalledWith(
      3,
      products[2],
      ["balanced"],
      null,
      undefined,
    );
  });

  it("passes constraints unchanged to the scoring layer", () => {
    const products = [createProduct()];
    const constraints = {
      minRam: 8,
      minBattery: 5000,
      minRating: 4.2,
      maxPrice: 80000,
    };

    rankProducts(products, ["gaming"], 80000, constraints);

    expect(mocks.scoreProduct).toHaveBeenCalledWith(
      products[0],
      ["gaming"],
      80000,
      constraints,
    );
  });

  it("uses the score returned by scoreProduct", () => {
    const product = createProduct();

    mocks.scoreProduct.mockReturnValueOnce({
      total: 91,
      breakdown: {
        ram: 90,
        processor: 95,
        battery: 85,
        rating: 92,
        total: 91,
      },
    });

    rankProducts([product], ["gaming"], 100000);

    expect(mocks.optimizeProduct).toHaveBeenCalledWith(
      expect.objectContaining({
        ...product,
        score: 91,
        breakdown: {
          ram: 90,
          processor: 95,
          battery: 85,
          rating: 92,
          total: 91,
        },
      }),
    );
  });

  it("calculates confidence from the score, rating and review count", () => {
    const product = createProduct({
      rating: 4.7,
      reviewsCount: 12000,
    });

    mocks.scoreProduct.mockReturnValueOnce({
      total: 88,
      breakdown: {
        ram: 80,
        processor: 92,
        battery: 84,
        rating: 94,
        total: 88,
      },
    });

    rankProducts([product], ["balanced"], null);

    expect(mocks.calculateConfidence).toHaveBeenCalledWith(
      88,
      4.7,
      12000,
    );
  });

  it("attaches calculated confidence to the optimized product", () => {
    const product = createProduct();

    mocks.scoreProduct.mockReturnValueOnce({
      total: 86,
      breakdown: {
        ram: 80,
        processor: 88,
        battery: 82,
        rating: 90,
        total: 86,
      },
    });

    mocks.calculateConfidence.mockReturnValueOnce(93);

    rankProducts([product], ["balanced"], null);

    expect(mocks.optimizeProduct).toHaveBeenCalledWith(
      expect.objectContaining({
        score: 86,
        confidence: 93,
      }),
    );
  });

  it("passes every scored product through optimizeProduct", () => {
    const products = [
      createProduct({ id: "product-1" }),
      createProduct({ id: "product-2" }),
      createProduct({ id: "product-3" }),
    ];

    rankProducts(products, ["balanced"], null);

    expect(mocks.optimizeProduct).toHaveBeenCalledTimes(products.length);

    for (const product of products) {
      expect(mocks.optimizeProduct).toHaveBeenCalledWith(
        expect.objectContaining({
          id: product.id,
          score: expect.any(Number),
          confidence: expect.any(Number),
        }),
      );
    }
  });

  it("sorts products only after all products have been scored and optimized", () => {
    const products = [
      createProduct({ id: "product-1" }),
      createProduct({ id: "product-2" }),
    ];

    const executionOrder: string[] = [];

    mocks.scoreProduct.mockImplementation((product: Product) => {
      executionOrder.push(`score:${product.id}`);

      return {
        total: product.id === "product-1" ? 80 : 90,
        breakdown: {
          ram: 75,
          processor: 80,
          battery: 85,
          rating: 90,
          total: product.id === "product-1" ? 80 : 90,
        },
      };
    });

    mocks.optimizeProduct.mockImplementation((product: Product) => {
      executionOrder.push(`optimize:${product.id}`);
      return product;
    });

    mocks.sortProducts.mockImplementation((items: Product[]) => {
      executionOrder.push("sort");
      return [...items].reverse();
    });

    rankProducts(products, ["balanced"], null);

    expect(executionOrder).toEqual([
      "score:product-1",
      "optimize:product-1",
      "score:product-2",
      "optimize:product-2",
      "sort",
    ]);
  });

  it("returns the exact result produced by sortProducts", () => {
    const products = [
      createProduct({ id: "product-1" }),
      createProduct({ id: "product-2" }),
    ];

    const sortedResult = [
      createProduct({ id: "product-2", score: 95, confidence: 91 }),
      createProduct({ id: "product-1", score: 80, confidence: 84 }),
    ];

    mocks.sortProducts.mockReturnValueOnce(sortedResult);

    const result = rankProducts(products, ["balanced"], null);

    expect(result).toBe(sortedResult);
  });

  it("supports weighted intents without modifying them", () => {
    const product = createProduct();

    const weightedIntent = [
      { type: "gaming" as const, weight: 0.7 },
      { type: "battery" as const, weight: 0.3 },
    ];

    rankProducts([product], weightedIntent, 100000);

    expect(mocks.scoreProduct).toHaveBeenCalledWith(
      product,
      weightedIntent,
      100000,
      undefined,
    );
  });

  it("preserves the original product data while adding ranking metadata", () => {
    const product = createProduct({
      name: "Galaxy Test Ultra",
      brand: "Samsung",
      price: 89999,
    });

    mocks.scoreProduct.mockReturnValueOnce({
      total: 94,
      breakdown: {
        ram: 100,
        processor: 96,
        battery: 90,
        rating: 94,
        total: 94,
      },
    });

    mocks.calculateConfidence.mockReturnValueOnce(97);

    rankProducts([product], ["gaming"], 100000);

    expect(mocks.optimizeProduct).toHaveBeenCalledWith(
      expect.objectContaining({
        id: product.id,
        name: product.name,
        brand: product.brand,
        price: product.price,
        score: 94,
        confidence: 97,
      }),
    );
  });

  it("does not mutate the original products array", () => {
    const products = [
      createProduct({ id: "product-1" }),
      createProduct({ id: "product-2" }),
    ];

    const originalOrder = [...products];

    rankProducts(products, ["balanced"], null);

    expect(products).toEqual(originalOrder);
  });

  it("handles a score result with an undefined total safely", () => {
    const product = createProduct();

    mocks.scoreProduct.mockReturnValueOnce({
      total: undefined,
      breakdown: {
        ram: 50,
        processor: 50,
        battery: 50,
        rating: 50,
        total: 0,
      },
    });

    mocks.calculateConfidence.mockReturnValueOnce(50);

    rankProducts([product], ["balanced"], null);

    expect(mocks.calculateConfidence).toHaveBeenCalledWith(
      0,
      product.rating,
      product.reviewsCount,
    );

    expect(mocks.optimizeProduct).toHaveBeenCalledWith(
      expect.objectContaining({
        score: 0,
        confidence: 50,
      }),
    );
  });
});