import { Router } from "express"
import { runEngine } from "../../modules/decision-engine/engine"
import { products } from "../../data/products"
import { parseQuery } from "../../modules/decision-engine/parser/queryParser"

export const searchRouter = Router()

searchRouter.get("/", (req, res) => {
  const query = (req.query.q as string)?.trim()

  if (!query) {
    return res.status(400).json({
      error: "Query is required",
    })
  }

  // 🔥 PARSE QUERY
  const parsed = parseQuery(query)

  // 🔥 RUN ENGINE WITH PARSED INPUT
  const result = runEngine(parsed, products)

  // 🔥 FINAL RESPONSE (avoid duplicate parsed)
  res.json(result)
})