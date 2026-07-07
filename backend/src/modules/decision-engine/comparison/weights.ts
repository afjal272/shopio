import { IntentType } from "../types"

export interface ComparisonWeight {
  cpu: number
  ram: number
  battery: number
  camera: number
  value: number
}

export const COMPARISON_WEIGHTS: Record<
  IntentType,
  ComparisonWeight
> = {
  gaming: {
    cpu: 4,
    ram: 3,
    battery: 2,
    camera: 1,
    value: 1,
  },

  battery: {
    cpu: 1,
    ram: 1,
    battery: 4,
    camera: 1,
    value: 2,
  },

  camera: {
    cpu: 1,
    ram: 1,
    battery: 1,
    camera: 4,
    value: 2,
  },

  balanced: {
    cpu: 3,
    ram: 2,
    battery: 2,
    camera: 2,
    value: 2,
  },
}