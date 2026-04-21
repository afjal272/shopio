import { Router } from "express"
import { PrismaClient } from "@prisma/client"
import { runEngine } from "../../modules/decision-engine/engine"

const router = Router()
const prisma = new PrismaClient()

router.get("/", async (req, res) => {
  const query = req.query.q as string

  if (!query) {
    return res.status(400).json({ error: "Query missing" })
  }

  const products = await prisma.product.findMany()

  const result = runEngine(query, products)

  res.json(result)
})

export default router