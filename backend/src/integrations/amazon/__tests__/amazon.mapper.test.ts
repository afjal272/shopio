import { describe, expect, it } from "vitest";
import { mapAmazonProduct, normalizeProductSpecs } from "../amazon.mapper";

function rawProduct(title: string, extra: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    asin: "test-asin",
    product_title: title,
    product_url: "https://amazon.in/test",
    product_price: "29999",
    ...extra,
  };
}

describe("Amazon specification normalization", () => {
  it("extracts memory, battery, generic processor evidence, display, and protection", () => {
    const product = mapAmazonProduct(rawProduct(
      "Lava Bold N2 5G (Regal Gold, 4GB RAM, 64GB Storage) | 6000 mAh Super Battery | Octacore Ultrafast Processor | Biggest 6.75 (HD+) 120Hz Display | IP64 Dust & Water Resistant",
    ));

    expect(product?.specs).toMatchObject({
      ram: 4,
      storage: 64,
      battery: 6000,
      processorType: "Octacore Ultrafast Processor",
      processorCores: 8,
      displaySize: 6.75,
      refreshRate: 120,
      ipRating: "IP64",
    });
    expect(product?.specs.chipset).toBeUndefined();
    expect(product?.specs.processorScore).toBeUndefined();
  });

  it("extracts concrete processor and camera values from title text", () => {
    const product = mapAmazonProduct(rawProduct(
      "Samsung Galaxy S25 Edge 5G 12GB RAM 512GB Storage Snapdragon 8 Elite for Galaxy 200MP Main Camera 5000mAh",
    ));

    expect(product?.specs).toMatchObject({
      ram: 12,
      storage: 512,
      chipset: "Snapdragon 8 Elite for Galaxy",
      cameraMp: 200,
      battery: 5000,
    });
  });

  it("normalizes structured and nested source values without erasing valid fields", () => {
    const specs = normalizeProductSpecs({
      name: "Phone 8GB RAM 1TB Storage",
      description: "Battery Capacity: 5,000 mAh. Rear Camera: 50 MP.",
      specs: {
        legacyFlag: true,
        processorScore: 9,
        details: [{ "Charging Power": "65 W" }],
      },
    });

    expect(specs).toMatchObject({
      ram: 8,
      storage: 1024,
      battery: 5000,
      cameraMp: 50,
      chargingSpeed: 65,
      legacyFlag: true,
    });
    expect(specs.processorScore).toBeUndefined();
  });

  it("does not infer specifications from unrelated numbers", () => {
    const product = mapAmazonProduct(rawProduct(
      "Motorola Edge 60 Fusion (Mykonos Blue, 12, GB, 256)",
    ));

    expect(product?.specs).toMatchObject({ ram: 12, storage: 256 });
    expect(product?.specs.battery).toBeUndefined();
    expect(product?.specs.chipset).toBeUndefined();
    expect(product?.specs.cameraMp).toBeUndefined();
    expect(product?.specs.refreshRate).toBeUndefined();
  });
});
