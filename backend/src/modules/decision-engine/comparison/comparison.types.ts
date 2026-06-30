import { IntentType, Product } from "../types"

// =======================================
// Comparison Score
// =======================================

export interface ComparisonScore {
  id: string
  score: number
}

// =======================================
// Product Weakness
// =======================================

export interface ProductWeakness {
  id: string
  points: string[]
}

// =======================================
// Winner Information
// =======================================

export interface ComparisonWinner {
  winner: Product
  runnerUp: Product
  rankedProducts: (Product & {
    score: number
  })[]
}

// =======================================
// Final Comparison Response
// =======================================

export interface ComparisonResult {
  winner: string | null

  reasons: string[]

  scores: ComparisonScore[]

  weaknesses: ProductWeakness[]

  intent: IntentType[]
}

// =======================================
// Internal Score Card
// (Used by calculateScores.ts)
// =======================================

export interface ScoreCard {
  cpu: number

  ram: number

  battery: number

  camera: number

  value: number

  total: number
}

// =======================================
// Scored Product
// =======================================

export interface ScoredProduct extends Product {
  score: number

  scoreCard: ScoreCard
}