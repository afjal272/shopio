import { IntentType, Product } from "../types"

import { ComparisonResult } from "./comparison.types"

import { calculateScores } from "./calculateScores"
import { calculateWinner } from "./calculateWinner"
import { calculateWeaknesses } from "./calculateWeaknesses"

function compareTwo(
  winner: Product,
  runnerUp: Product,
  intent: IntentType[]
): string[] {

  const reasons: string[] = []

  const winnerSpecs = winner.specs ?? {}
  const runnerSpecs = runnerUp.specs ?? {}

  if (intent.includes("gaming")) {

    if (
      (winnerSpecs.processorScore ?? 0) >
      (runnerSpecs.processorScore ?? 0)
    ) {
      reasons.push(
        `${winner.name} delivers better gaming performance`
      )
    }

    if (
      (winnerSpecs.ram ?? 0) >
      (runnerSpecs.ram ?? 0)
    ) {
      reasons.push(
        `${winner.name} has better multitasking capability`
      )
    }

  }

  if (intent.includes("battery")) {

    if (
      (winnerSpecs.battery ?? 0) >
      (runnerSpecs.battery ?? 0)
    ) {
      reasons.push(
        `${winner.name} offers longer battery life`
      )
    }

  }

  if (intent.includes("camera")) {

    if (winner.rating > runnerUp.rating) {

      reasons.push(
        `${winner.name} provides a better camera experience`
      )

    }

  }

  if (winner.score! > runnerUp.score!) {

    reasons.push(
      `${winner.name} delivers better overall value`
    )

  }

  return [...new Set(reasons)].slice(0, 4)

}

export function compareProducts(
  products: Product[],
  intent: IntentType[] = ["balanced"]
): ComparisonResult {

  if (products.length < 2) {

    return {

      winner: null,

      reasons: [],

      scores: [],

      weaknesses: [],

      intent,

    }

  }

  const scoredProducts =
    calculateScores(products, intent)

  const comparison =
    calculateWinner(scoredProducts)

  if (!comparison) {

    return {

      winner: null,

      reasons: [],

      scores: [],

      weaknesses: [],

      intent,

    }

  }

  const reasons = compareTwo(
    comparison.winner,
    comparison.runnerUp,
    intent
  )

  const weaknesses =
    calculateWeaknesses(
      comparison.rankedProducts
    )

  return {

    winner: comparison.winner.id,

    reasons,

    scores: comparison.rankedProducts.map((product) => ({

      id: product.id,

      score: product.score,

    })),

    weaknesses,

    intent,

  }

}