import { describe, expect, it } from "vitest";
import { calculateConfidence } from "../confidence";

describe("calculateConfidence", () => {
  it("returns a valid confidence score between 0 and 100", () => {
    const confidence = calculateConfidence(85, 4.5, 5000);

    expect(confidence).toBeGreaterThanOrEqual(0);
    expect(confidence).toBeLessThanOrEqual(100);
  });

  it("returns a finite confidence value", () => {
    const confidence = calculateConfidence(85, 4.5, 5000);

    expect(Number.isFinite(confidence)).toBe(true);
  });

  it("increases confidence for stronger product scores", () => {
    const lowScore = calculateConfidence(50, 4.5, 5000);
    const highScore = calculateConfidence(90, 4.5, 5000);

    expect(highScore).toBeGreaterThan(lowScore);
  });

  it("increases confidence for stronger ratings", () => {
    const lowRating = calculateConfidence(80, 3.5, 5000);
    const highRating = calculateConfidence(80, 4.8, 5000);

    expect(highRating).toBeGreaterThan(lowRating);
  });

  it("increases confidence when a product has stronger review evidence", () => {
    const lowReviews = calculateConfidence(80, 4.5, 100);
    const highReviews = calculateConfidence(80, 4.5, 10000);

    expect(highReviews).toBeGreaterThan(lowReviews);
  });

  it("handles zero reviews safely", () => {
    const confidence = calculateConfidence(80, 4.5, 0);

    expect(Number.isFinite(confidence)).toBe(true);
    expect(confidence).toBeGreaterThanOrEqual(0);
    expect(confidence).toBeLessThanOrEqual(100);
  });

  it("handles zero rating safely", () => {
    const confidence = calculateConfidence(80, 0, 1000);

    expect(Number.isFinite(confidence)).toBe(true);
    expect(confidence).toBeGreaterThanOrEqual(0);
    expect(confidence).toBeLessThanOrEqual(100);
  });

  it("handles zero score safely", () => {
    const confidence = calculateConfidence(0, 4.5, 5000);

    expect(Number.isFinite(confidence)).toBe(true);
    expect(confidence).toBeGreaterThanOrEqual(0);
    expect(confidence).toBeLessThanOrEqual(100);
  });

  it("handles all zero inputs safely", () => {
    const confidence = calculateConfidence(0, 0, 0);

    expect(Number.isFinite(confidence)).toBe(true);
    expect(confidence).toBeGreaterThanOrEqual(0);
    expect(confidence).toBeLessThanOrEqual(100);
  });

  it("handles very large review counts safely", () => {
    const confidence = calculateConfidence(95, 5, Number.MAX_SAFE_INTEGER);

    expect(Number.isFinite(confidence)).toBe(true);
    expect(confidence).toBeGreaterThanOrEqual(0);
    expect(confidence).toBeLessThanOrEqual(100);
  });

  it("handles high input values without exceeding the maximum", () => {
    const confidence = calculateConfidence(100, 5, Number.MAX_SAFE_INTEGER);

    expect(confidence).toBeLessThanOrEqual(100);
  });

  it("does not produce negative confidence for negative score input", () => {
    const confidence = calculateConfidence(-100, 4.5, 5000);

    expect(Number.isFinite(confidence)).toBe(true);
    expect(confidence).toBeGreaterThanOrEqual(0);
  });

  it("does not exceed the maximum confidence for oversized score input", () => {
    const confidence = calculateConfidence(1000, 5, 100000);

    expect(confidence).toBeLessThanOrEqual(100);
  });

  it("produces deterministic results for identical inputs", () => {
    const first = calculateConfidence(87, 4.6, 3500);
    const second = calculateConfidence(87, 4.6, 3500);

    expect(second).toBe(first);
  });

  it("returns an integer confidence score", () => {
    const confidence = calculateConfidence(83, 4.37, 1275);

    expect(Number.isInteger(confidence)).toBe(true);
  });

  it("keeps confidence monotonic when only the score improves", () => {
    const scores = [20, 40, 60, 80, 100];
    const confidences = scores.map((score) =>
      calculateConfidence(score, 4.5, 5000),
    );

    for (let index = 1; index < confidences.length; index += 1) {
      expect(confidences[index]).toBeGreaterThanOrEqual(
        confidences[index - 1],
      );
    }
  });

  it("keeps confidence monotonic when only the rating improves", () => {
    const ratings = [1, 2, 3, 4, 5];
    const confidences = ratings.map((rating) =>
      calculateConfidence(80, rating, 5000),
    );

    for (let index = 1; index < confidences.length; index += 1) {
      expect(confidences[index]).toBeGreaterThanOrEqual(
        confidences[index - 1],
      );
    }
  });

  it("keeps confidence monotonic when only review evidence improves", () => {
    const reviewCounts = [0, 10, 100, 1000, 10000];
    const confidences = reviewCounts.map((reviews) =>
      calculateConfidence(80, 4.5, reviews),
    );

    for (let index = 1; index < confidences.length; index += 1) {
      expect(confidences[index]).toBeGreaterThanOrEqual(
        confidences[index - 1],
      );
    }
  });
});