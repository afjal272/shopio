import { CategoryType, Constraints } from "../types"

export interface FilterOptions {
  budget?: number | null
  category?: CategoryType | null
  constraints?: Constraints
}