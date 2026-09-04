import { describe, expect, it } from "vitest";
import { Product } from "../../types";
import { sortProducts } from "../sortProducts";

function createProduct(overrides: Partial<Product> = {}): Product & { score: number } {
  return {
    id: "product-1",
    name: "Test Product",
    brand: "Samsung",
    category: "smartphone",
    description: "Test product",
    price: 59999,
    rating: 4.5,
    reviewsCount: 1000,
    images: [],
    tags: [],
    highlights: [],
    weaknesses: [],
    specs: {},
    score: 80,
    ...overrides,
  };
}

describe("sortProducts", () => {
  it("returns an empty array when no products are provided", () => {
    expect(sortProducts([])).toEqual([]);
  });

  it("returns the same product when given a single product", () => {
    const product = createProduct();

    expect(sortProducts([product])).toEqual([product]);
  });

  it("sorts products by highest score first", () => {
    const products = [
      createProduct({ id: "low", score: 60 }),
      createProduct({ id: "high", score: 95 }),
      createProduct({ id: "medium", score: 80 }),
    ];

    const result = sortProducts(products);

    expect(result.map((product) => product.id)).toEqual([
      "high",
      "medium",
      "low",
    ]);
  });

  it("uses review count as the first tie-breaker", () => {
    const products = [
      createProduct({ id: "low-reviews", score: 90, reviewsCount: 500 }),
      createProduct({ id: "high-reviews", score: 90, reviewsCount: 5000 }),
      createProduct({ id: "medium-reviews", score: 90, reviewsCount: 2000 }),
    ];

    const result = sortProducts(products);

    expect(result.map((product) => product.id)).toEqual([
      "high-reviews",
      "medium-reviews",
      "low-reviews",
    ]);
  });

  it("uses rating when score and reviews are equal", () => {
    const products = [
      createProduct({ id: "low-rating", score: 90, reviewsCount: 5000, rating: 4.1 }),
      createProduct({ id: "high-rating", score: 90, reviewsCount: 5000, rating: 4.8 }),
      createProduct({ id: "medium-rating", score: 90, reviewsCount: 5000, rating: 4.5 }),
    ];

    const result = sortProducts(products);

    expect(result.map((product) => product.id)).toEqual([
      "high-rating",
      "medium-rating",
      "low-rating",
    ]);
  });

  it("uses lower price when score, reviews and rating are equal", () => {
    const products = [
      createProduct({ id: "expensive", score: 90, reviewsCount: 5000, rating: 4.5, price: 79999 }),
      createProduct({ id: "cheap", score: 90, reviewsCount: 5000, rating: 4.5, price: 49999 }),
      createProduct({ id: "medium", score: 90, reviewsCount: 5000, rating: 4.5, price: 59999 }),
    ];

    const result = sortProducts(products);

    expect(result.map((product) => product.id)).toEqual([
      "cheap",
      "medium",
      "expensive",
    ]);
  });

  it("uses alphabetical brand order as the final tie-breaker", () => {
    const products = [
      createProduct({ id: "samsung", brand: "Samsung", score: 90, reviewsCount: 5000, rating: 4.5, price: 59999 }),
      createProduct({ id: "apple", brand: "Apple", score: 90, reviewsCount: 5000, rating: 4.5, price: 59999 }),
      createProduct({ id: "google", brand: "Google", score: 90, reviewsCount: 5000, rating: 4.5, price: 59999 }),
    ];

    const result = sortProducts(products);

    expect(result.map((product) => product.id)).toEqual([
      "apple",
      "google",
      "samsung",
    ]);
  });

  it("applies all tie-breakers in the correct priority order", () => {
    const products = [
      createProduct({
        id: "product-a",
        score: 90,
        reviewsCount: 1000,
        rating: 4.8,
        price: 50000,
        brand: "Samsung",
      }),
      createProduct({
        id: "product-b",
        score: 90,
        reviewsCount: 2000,
        rating: 4.1,
        price: 90000,
        brand: "Apple",
      }),
      createProduct({
        id: "product-c",
        score: 95,
        reviewsCount: 100,
        rating: 4.0,
        price: 100000,
        brand: "Google",
      }),
      createProduct({
        id: "product-d",
        score: 90,
        reviewsCount: 1000,
        rating: 4.8,
        price: 40000,
        brand: "Apple",
      }),
    ];

    const result = sortProducts(products);

    expect(result.map((product) => product.id)).toEqual([
      "product-c",
      "product-b",
      "product-d",
      "product-a",
    ]);
  });

  it("correctly sorts decimal scores", () => {
    const products = [
      createProduct({ id: "score-82-4", score: 82.4 }),
      createProduct({ id: "score-91-7", score: 91.7 }),
      createProduct({ id: "score-91-2", score: 91.2 }),
      createProduct({ id: "score-82-9", score: 82.9 }),
    ];

    const result = sortProducts(products);

    expect(result.map((product) => product.id)).toEqual([
      "score-91-7",
      "score-91-2",
      "score-82-9",
      "score-82-4",
    ]);
  });

  it("does not mutate the original products array", () => {
    const products = [
      createProduct({ id: "low", score: 60 }),
      createProduct({ id: "high", score: 95 }),
      createProduct({ id: "medium", score: 80 }),
    ];

    const originalOrder = products.map((product) => product.id);

    sortProducts(products);

    expect(products.map((product) => product.id)).toEqual(originalOrder);
  });

  it("returns a new array instead of the original array", () => {
    const products = [
      createProduct({ id: "product-1", score: 80 }),
      createProduct({ id: "product-2", score: 90 }),
    ];

    const result = sortProducts(products);

    expect(result).not.toBe(products);
  });

  it("keeps identical products deterministic", () => {
    const products = [
      createProduct({ id: "product-a", score: 90, reviewsCount: 1000, rating: 4.5, price: 50000, brand: "Apple" }),
      createProduct({ id: "product-b", score: 90, reviewsCount: 1000, rating: 4.5, price: 50000, brand: "Apple" }),
      createProduct({ id: "product-c", score: 90, reviewsCount: 1000, rating: 4.5, price: 50000, brand: "Apple" }),
    ];

    const firstResult = sortProducts(products);
    const secondResult = sortProducts(products);

    expect(firstResult.map((product) => product.id)).toEqual(
      secondResult.map((product) => product.id),
    );
  });

  it("handles zero scores without throwing", () => {
    const products = [
      createProduct({ id: "zero", score: 0 }),
      createProduct({ id: "positive", score: 50 }),
    ];

    const result = sortProducts(products);

    expect(result.map((product) => product.id)).toEqual([
      "positive",
      "zero",
    ]);
  });

  it("handles products with zero reviews and ratings", () => {
    const products = [
      createProduct({
        id: "weak",
        score: 70,
        reviewsCount: 0,
        rating: 0,
      }),
      createProduct({
        id: "strong",
        score: 70,
        reviewsCount: 100,
        rating: 4,
      }),
    ];

    const result = sortProducts(products);

    expect(result.map((product) => product.id)).toEqual([
      "strong",
      "weak",
    ]);
  });
});