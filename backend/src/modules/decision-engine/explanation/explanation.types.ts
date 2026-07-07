import {
  Constraints,
  IntentType,
  WeightedIntent,
} from "../types"

export interface ExplanationOptions {
  intent: IntentType[] | WeightedIntent[]
  constraints?: Constraints
}

export interface RejectionReason {
  id: string
  reason: string
}