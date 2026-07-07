import {
  Constraints,
  IntentType,
  Product,
  WeightedIntent,
} from "../types";

import { scoreProduct } from "../scoring/scoreProduct";

import { calculateConfidence } from "./confidence";
import { optimizeProduct } from "../engine/optimizer";
import { sortProducts } from "./sortProducts";

export function rankProducts(
  products: Product[],
  intent: IntentType[] | WeightedIntent[],
  budget: number | null,
  constraints?: Constraints
): Product[] {

  const rankedProducts = products.map((product) => {

    const scoreResult = scoreProduct(
      product,
      intent,
      budget,
      constraints
    );

    const confidence = calculateConfidence(
      scoreResult.total ?? 0,
      product.rating,
      product.reviewsCount
    );

    return optimizeProduct({
      ...product,

      score: scoreResult.total ?? 0,

      breakdown: scoreResult.breakdown,

      confidence,
    });

  });

  return sortProducts(rankedProducts);

}