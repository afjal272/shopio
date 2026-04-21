import { Router } from "express"
import { runEngine } from "../../modules/decision-engine/engine"
import { products } from "../../data/products"

export const searchRouter = Router()

searchRouter.get("/", (req, res) => {
  const query = req.query.q as string

  if (!query) {
    return res.status(400).json({
      error: "Query is required",
    })
  }

  const result = runEngine(query, products)

  res.json(result)
})