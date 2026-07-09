import {
  CategoryType,
  Constraints,
  Product,
} from "../types";

// =======================================
// Filter Options
// =======================================

export interface FilterOptions {
  budget?: number | null;

  category?: CategoryType | null;

  constraints?: Constraints;
}

// =======================================
// Rejection Stage
// =======================================

export type RejectionStage =
  | "budget"
  | "category"
  | "constraint"
  | "intent";

// =======================================
// Rejected Product
// =======================================

export interface RejectedProduct {
  product: Product;

  reason: string;

  stage: RejectionStage;
}

// =======================================
// Filter Result
// =======================================

export interface FilterResult {
  matchedProducts: Product[];

  rejectedProducts: RejectedProduct[];
}