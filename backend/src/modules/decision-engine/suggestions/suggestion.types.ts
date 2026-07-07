import { ComparisonResult } from "../comparison";
import {
  IntentType,
  ParsedQuery,
  Product,
} from "../types";

// =======================================
// Suggestion Category
// =======================================

export type SuggestionCategory =
  | "budget"
  | "constraint"
  | "intent"
  | "coverage"
  | "alternative"
  | "query"
  | "upgrade"
  | "relaxed";

// =======================================
// Suggestion Priority
// =======================================

export type SuggestionPriority =
  | "low"
  | "medium"
  | "high"
  | "critical";

// =======================================
// Suggestion
// =======================================

export interface Suggestion {
  id: string;

  category: SuggestionCategory;

  priority: SuggestionPriority;

  title: string;

  description: string;

  confidence: number;

  impactScore: number;

  action?: string;

  metadata?: Record<string, unknown>;
}

// =======================================
// Shared Context
// =======================================

export interface SuggestionContext {
  parsed: ParsedQuery;

  products: Product[];

  matchedProducts: Product[];

  rankedProducts: Product[];

  bestProduct: Product | null;

  comparison?: ComparisonResult;

  isRelaxed: boolean;
}

// =======================================
// Analyzer Result
// =======================================

export interface AnalyzerResult<T = unknown> {
  analysis: T;

  suggestions: Suggestion[];

  confidence: number;
}

// =======================================
// Budget Analysis
// =======================================

export interface BudgetAnalysis {
  currentBudget: number | null;

  recommendedBudget: number | null;

  budgetGap: number;

  budgetStatus:
    | "under_budget"
    | "well_matched"
    | "over_budget";

  affordabilityScore: number;

  averageMatchedPrice: number;

  unlockedProducts: number;
}

// =======================================
// Affordability Analysis
// =======================================

export interface AffordabilityAnalysis {
  totalProducts: number;

  affordableProducts: number;

  expensiveProducts: number;

  affordabilityRatio: number;

  affordabilityScore: number;
}

// =======================================
// Confidence Analysis
// =======================================

export interface ConfidenceAnalysis {
  confidence: number;

  matchedProducts: number;

  totalProducts: number;

  hasBudget: boolean;

  hasIntent: boolean;

  hasConstraints: boolean;
}

// =======================================
// Tradeoff Analysis
// =======================================

export interface TradeoffAnalysis {
  strengths: string[];

  compromises: string[];

  scoreDifference: number;

  hasTradeoff: boolean;
}

// =======================================
// Constraint Analysis
// =======================================

export interface ConstraintAnalysis {
  removedProducts: number;

  limitingConstraint?: string;
}

// =======================================
// Intent Analysis
// =======================================

export interface IntentAnalysis {
  detectedIntent: IntentType[];

  missingIntent: IntentType[];
}

// =======================================
// Coverage Analysis
// =======================================

export interface CoverageAnalysis {
  totalProducts: number;

  matchedProducts: number;

  coverageScore: number;
}

// =======================================
// Final Suggestion Engine Result
// =======================================

export interface SuggestionEngineResult {
  suggestions: Suggestion[];

  confidence: number;

  metadata?: {
    generatedAt: number;

    totalSuggestions: number;
  };
}