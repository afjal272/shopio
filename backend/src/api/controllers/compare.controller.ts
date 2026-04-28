import { Request, Response } from "express"
import { compareProducts } from "../../modules/decision-engine/comparison/compareProducts"
import { products } from "../../data/products" // ✅ FIXED IMPORT

export const compareController = async (req: Request, res: Response) => {
  try {
    const body = req.body ?? {}
    const productIds = body.productIds

    // 🔥 NEW: INTENT INPUT (OPTIONAL)
    const intent = body.intent || ["balanced"]

    console.log("COMPARE BODY:", body)
    console.log("PRODUCT IDS:", productIds)
    console.log("INTENT:", intent)

    // ✅ HARD VALIDATION
    if (!Array.isArray(productIds)) {
      return res.status(400).json({
        message: "productIds must be an array",
        received: productIds ?? null
      })
    }

    // ✅ CLEAN IDS
    const ids = [...new Set(productIds.map((id: any) => String(id)))]
      .filter(Boolean)
      .slice(0, 4)

    if (ids.length < 2) {
      return res.status(400).json({
        message: "At least 2 products required",
        received: ids
      })
    }

    // ✅ SAFETY CHECK (CRITICAL)
    if (!Array.isArray(products)) {
      console.error("❌ PRODUCTS DATA INVALID:", products)
      return res.status(500).json({
        message: "Products data corrupted"
      })
    }

    const productMap = new Map(
      products.map((p) => [String(p.id), p])
    )

    const selectedProducts = ids
      .map((id) => productMap.get(id))
      .filter((p) => p != null)

    console.log("SELECTED PRODUCTS:", selectedProducts.length)

    if (selectedProducts.length < 2) {
      return res.status(400).json({
        message: "Not enough valid products",
        validProducts: selectedProducts.length
      })
    }

    // 🔥 ENGINE CALL SAFE (WITH INTENT)
    const comparison = compareProducts(selectedProducts, intent)

    // ✅ FINAL SAFETY
    if (!comparison) {
      return res.status(500).json({
        message: "Comparison failed"
      })
    }

    // 🔥 NEW: RESPONSE ENRICHMENT
    return res.json({
      products: selectedProducts,
      comparison: {
        ...comparison,
        intent // 👈 frontend ke liye important
      }
    })

  } catch (err) {
    console.error("❌ Compare error:", err)

    return res.status(500).json({
      message: "Server error",
      error: String(err)
    })
  }
}