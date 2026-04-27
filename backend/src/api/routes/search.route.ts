import { Router } from "express"
import { runEngine } from "../../modules/decision-engine/engine"
import { products } from "../../data/products"
import { parseQuery } from "../../modules/decision-engine/parser/queryParser"
import { compareController } from "../controllers/compare.controller"

export const searchRouter = Router()

// 🔍 SEARCH API
searchRouter.get("/", (req, res) => {
  try {
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

    // 🔥 RESPONSE
    res.json(result)

  } catch (err) {
    console.error("Search error:", err)
    res.status(500).json({
      error: "Internal server error",
    })
  }
})


// 🆚 COMPARE API (NEW)
searchRouter.post("/compare", compareController)