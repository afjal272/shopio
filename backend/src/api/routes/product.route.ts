import { Router, Request, Response } from "express"
import { products } from "../../data/products"

export const productRouter = Router()

// 🔥 GET ALL PRODUCTS
productRouter.get("/products", (_: Request, res: Response) => {
  console.log("GET /api/products")

  return res.status(200).json({
    success: true,
    data: products
  })
})

// 🔥 GET SINGLE PRODUCT
productRouter.get("/products/:id", (req: Request, res: Response) => {
  const { id } = req.params

  // ✅ VALIDATION
  if (!id) {
    return res.status(400).json({
      success: false,
      message: "Invalid product ID"
    })
  }

  const product = products.find(
    (p) => String(p.id) === String(id)
  )

  // ❌ NOT FOUND
  if (!product) {
    return res.status(404).json({
      success: false,
      message: "Product not found"
    })
  }

  // ✅ SUCCESS
  return res.status(200).json({
    success: true,
    data: product
  })
})