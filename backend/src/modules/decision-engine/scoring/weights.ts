import { IntentType } from "../types"

export const SCORE_WEIGHTS: Record<
  IntentType,
  {
    ram: number
    cpu: number
    batt: number
    rating: number
  }
> = {
  gaming: {
    ram: 0.30,
    cpu: 0.40,
    batt: 0.10,
    rating: 0.20,
  },

  camera: {
    ram: 0.10,
    cpu: 0.20,
    batt: 0.10,
    rating: 0.60,
  },

  battery: {
    ram: 0.10,
    cpu: 0.10,
    batt: 0.60,
    rating: 0.20,
  },

  balanced: {
    ram: 0.25,
    cpu: 0.25,
    batt: 0.20,
    rating: 0.30,
  },
}

export const BRAND_BOOST: Record<string, number> = {
  samsung: 0.06,
  apple: 0.10,
  iqoo: 0.05,
  realme: 0.04,
  redmi: 0.04,
  poco: 0.05,
}