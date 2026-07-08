import { Request, Response } from "express";

import { compareProducts } from "../../modules/decision-engine/comparison";

import { productService } from "../../services/product.service";

export const compareController = async (
  req: Request,
  res: Response
) => {

  try {

    const {
      productIds,
      intent = ["balanced"],
    } = req.body;

    if (!Array.isArray(productIds)) {

      return res.status(400).json({
        message: "productIds must be an array",
      });

    }

    const ids = [
      ...new Set(
        productIds.map(String)
      ),
    ]
      .filter(Boolean)
      .slice(0, 4);

    if (ids.length < 2) {

      return res.status(400).json({
        message: "At least 2 products are required",
      });

    }

    const allProducts =
      await productService.getAllProducts();

    const productMap = new Map(
      allProducts.map((product) => [
        product.id,
        product,
      ])
    );

    const selectedProducts = ids
      .map((id) => productMap.get(id))
      .filter(
        (
          product
        ): product is NonNullable<typeof product> =>
          product !== undefined
      );

    if (selectedProducts.length < 2) {

      return res.status(400).json({
        message: "Not enough valid products",
      });

    }

    const comparison =
      compareProducts(
        selectedProducts,
        intent
      );

    return res.status(200).json({

      products: selectedProducts,

      comparison,

    });

  } catch (error) {

    console.error(
      "Compare error:",
      error
    );

    return res.status(500).json({
      message: "Internal server error",
    });

  }

};