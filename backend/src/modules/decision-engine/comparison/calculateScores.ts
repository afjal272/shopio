import { Product, IntentType } from "../types"

import {
  ScoredProduct,
  ScoreCard,
} from "./comparison.types"

import { COMPARISON_WEIGHTS } from "./weights"

import {
  normalizeBattery,
  normalizeCamera,
  normalizeCPU,
  normalizeRAM,
  normalizeValue,
} from "./normalizers"

export function calculateScores(
  products: Product[],
  intent: IntentType[] = ["balanced"]
): ScoredProduct[] {

  const primaryIntent =
    intent.length > 0
      ? intent[0]
      : "balanced"

  const weights =
    COMPARISON_WEIGHTS[primaryIntent]

  return products.map((product) => {

    const specs = product.specs ?? {}

    const cpu =
      normalizeCPU(specs.processorScore ?? 0)

    const ram =
      normalizeRAM(specs.ram ?? 0)

    const battery =
      normalizeBattery(
        specs.battery ?? 0,
        cpu
      )

    const camera =
      normalizeCamera(
        product.rating,
        product.reviewsCount
      )

    const baseScore =
      cpu * 3 +
      ram * 2 +
      battery * 2 +
      camera * 2

    const value =
      normalizeValue(
        baseScore,
        product.price
      )

    const scoreCard: ScoreCard = {

      cpu,

      ram,

      battery,

      camera,

      value,

      total:
        cpu * weights.cpu +
        ram * weights.ram +
        battery * weights.battery +
        camera * weights.camera +
        value * weights.value,

    }

    return {

      ...product,

      score: Number(scoreCard.total.toFixed(2)),

      scoreCard,

    }

  })

}