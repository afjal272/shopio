import { Router } from "express"
import { runEngine } from "../../modules/decision-engine/engine"
import { products } from "../../data/products"

export const searchRouter = Router()

searchRouter.post("/", (req, res) => {
  const { query } = req.body

  if (!query) {
    return res.status(400).json({
      error: "Query is required"
    })
  }

  const result = runEngine(query, products)

  res.json(result)
})