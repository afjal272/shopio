import { ComparisonResult } from "../comparison";
import { Suggestion } from "../suggestions";
import { ParsedQuery, Product } from "../types";

// ======================================================
// Engine Result
// ======================================================

export interface EngineResult {
  best: Product | null;

  recommendations: Product[];

  notRecommended: RejectedProduct[];

  comparison: ComparisonResult;

  parsed: ParsedQuery;

  isRelaxed: boolean;

  confidence: number;

  suggestions: Suggestion[];

  metadata: EngineMetadata;
}

// ======================================================
// Candidate Selection
// ======================================================

export interface CandidateSelectionResult {
  best: Product | null;

  recommendedProducts: Product[];

  rejectedProducts: Product[];
}

// ======================================================
// Product Reasoning
// ======================================================

export interface ProductReasoning {
  explanation: string;

  rejectionReason?: string;

  confidence: number;
}

// ======================================================
// Rejected Product
// ======================================================

export interface RejectedProduct {
  id: string;

  name: string;

  reason: string;
}

// ======================================================
// Engine Metadata
// ======================================================

export interface EngineMetadata {
  version: string;

  executionTime: number;

  fallbackLevel: number;

  appliedRules: string[];

  timestamp: number;
}

// ======================================================
// Fallback Result
// ======================================================

export interface FallbackResult {
  products: Product[];

  isRelaxed: boolean;

  level: 0 | 1 | 2;

  appliedRules: string[];
}

// ======================================================
// Engine Stage
// ======================================================

export type EngineStage =
  | "filter"
  | "fallback"
  | "ranking"
  | "candidate-selection"
  | "comparison"
  | "reasoning"
  | "suggestions"
  | "optimization"
  | "output"
  | "completed";