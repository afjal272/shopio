import { IntentType } from "../types";

export interface IntentScoreWeights {
  ram: number;
  processor: number;
  battery: number;
  rating: number;
  camera: number;
}

export const SCORE_WEIGHTS: Record<
  IntentType,
  IntentScoreWeights
> = {
  gaming: {
    ram: 0.30,
    processor: 0.45,
    battery: 0.10,
    rating: 0.10,
    camera: 0.05,
  },

  camera: {
    ram: 0.08,
    processor: 0.12,
    battery: 0.05,
    rating: 0.15,
    camera: 0.60,
  },

  battery: {
    ram: 0.08,
    processor: 0.10,
    battery: 0.65,
    rating: 0.15,
    camera: 0.02,
  },

  balanced: {
    ram: 0.22,
    processor: 0.28,
    battery: 0.20,
    rating: 0.25,
    camera: 0.05,
  },
};