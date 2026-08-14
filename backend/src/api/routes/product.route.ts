import {
  Request,
  Response,
  Router,
} from "express";

import { productService } from "../../services/product.service";

export const productRouter = Router();

// ======================================================
// GET ALL PRODUCTS
// ======================================================

productRouter.get(
  "/products",
  async (
    _req: Request,
    res: Response
  ) => {
    try {
      const products =
        await productService.getAllProducts();

      return res.status(200).json({
        success: true,
        data: products,
      });
    } catch (error: unknown) {
      console.error(
        "GET PRODUCTS ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message: "Failed to fetch products",
      });
    }
  }
);

// ======================================================
// GET SINGLE PRODUCT
// ======================================================

productRouter.get(
  "/products/:id",
  async (
    req: Request,
    res: Response
  ) => {
    const id =
      typeof req.params.id === "string"
        ? req.params.id.trim()
        : "";

    // --------------------------------------------------
    // Validate ID
    // --------------------------------------------------

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }

    try {
      const product =
        await productService.getProductById(id);

      // ------------------------------------------------
      // Product Not Found
      // ------------------------------------------------

      if (!product) {
        return res.status(404).json({
          success: false,
          message: "Product not found",
        });
      }

      return res.status(200).json({
        success: true,
        data: product,
      });
    } catch (error: unknown) {
      console.error(
        "GET SINGLE PRODUCT ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message: "Error fetching product",
      });
    }
  }
);