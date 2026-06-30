import { Router } from "express"
import { runEngine } from "../../modules/decision-engine/engine"
import { parseQuery } from "../../modules/decision-engine/parser/queryParser"
import { compareController } from "../controllers/compare.controller"
import { productService } from "../../services/product.service"

export const searchRouter = Router()

// SEARCH API
searchRouter.get("/", async (req, res) => {
  try {
    const query = (req.query.q as string)?.trim()

    if (!query) {
      return res.status(400).json({
        error: "Query is required",
      })
    }

    // PARSE QUERY
    const parsed = parseQuery(query)

    // FETCH PRODUCTS FROM DATABASE
    const products = await productService.getAllProducts()

    // RUN DECISION ENGINE
    const result = runEngine(parsed, products)

    // RESPONSE
    return res.status(200).json(result)

  } catch (err) {
    console.error("Search error:", err)

    return res.status(500).json({
      error: "Internal server error",
    })
  }
})

// COMPARE API
searchRouter.post("/compare", compareController)