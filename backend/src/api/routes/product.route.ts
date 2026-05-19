import { Router, Request, Response } from "express"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export const productRouter = Router()

// GET ALL PRODUCTS
productRouter.get("/products", async (_: Request, res: Response) => {
  try {
    const products = await prisma.product.findMany()

    return res.status(200).json({
      success: true,
      data: products,
    })
  } catch (error) {
    console.error("GET PRODUCTS ERROR:", error)

    return res.status(500).json({
      success: false,
      message: "Failed to fetch products",
    })
  }
})

// GET SINGLE PRODUCT
productRouter.get("/products/:id", async (req: Request, res: Response) => {
  const id =
    typeof req.params.id === "string"
      ? req.params.id.trim()
      : ""

  // VALIDATE ID
  if (!id) {
    return res.status(400).json({
      success: false,
      message: "Invalid product ID",
    })
  }

  try {
    const product = await prisma.product.findUnique({
      where: { id },
    })

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      })
    }

    return res.status(200).json({
      success: true,
      data: product,
    })
  } catch (error) {
    console.error("GET SINGLE PRODUCT ERROR:", error)

    return res.status(500).json({
      success: false,
      message: "Error fetching product",
    })
  }
})