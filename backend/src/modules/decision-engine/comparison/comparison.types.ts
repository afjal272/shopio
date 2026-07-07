import {
  IntentType,
  Product,
  WeightedIntent,
} from "../types";

// =======================================
// Comparison Score
// =======================================

export interface ComparisonScore {
  id: string;

  score: number;

  confidence?: number;
}

// =======================================
// Product Weakness
// =======================================

export interface ProductWeakness {
  id: string;

  points: string[];
}

// =======================================
// Product Strength
// =======================================

export interface ProductStrength {
  id: string;

  points: string[];
}

// =======================================
// Score Card
// =======================================

export interface ScoreCard {
  cpu: number;

  ram: number;

  battery: number;

  camera: number;

  value: number;

  trust: number;

  priceFit: number;

  total: number;
}

// =======================================
// Scored Product
// =======================================

export interface ScoredProduct extends Product {
  score: number;

  scoreCard: ScoreCard;
}

// =======================================
// Winner Information
// =======================================

export interface ComparisonWinner {
  winner: ScoredProduct;

  runnerUp: ScoredProduct;

  rankedProducts: ScoredProduct[];

  winningMargin: number;
}

// =======================================
// Category Winners
// =======================================

export interface CategoryWinner {
  gaming?: string;

  battery?: string;

  camera?: string;

  value?: string;

  trust?: string;
}

// =======================================
// Final Comparison Response
// =======================================

export interface ComparisonResult {
  winner: string | null;

  reasons: string[];

  scores: ComparisonScore[];

  weaknesses: ProductWeakness[];

  strengths: ProductStrength[];

  categoryWinners?: CategoryWinner;

  confidence: number;

  intent: IntentType[] | WeightedIntent[];
}