import {
  Router,
  Request,
  Response,
} from "express";

import {
  Marketplace,
} from "@prisma/client";

import {
  runEngine,
} from "../../modules/decision-engine/engine";

import {
  parseQuery,
} from "../../modules/decision-engine/parser/queryParser";

import {
  compareController,
} from "../controllers/compare.controller";

import {
  productService,
} from "../../services/product.service";

// ======================================================
// Router
// ======================================================

export const searchRouter =
  Router();

// ======================================================
// Search
// ======================================================

searchRouter.get(
  "/",
  async (
    req: Request,
    res: Response
  ) => {
    try {

      const query =
        typeof req.query.q === "string"
          ? req.query.q.trim()
          : "";

      if (!query) {
        return res.status(400).json({
          success: false,
          error: "Query is required",
        });
      }

      // ------------------------------------------------
      // Parse User Query
      // ------------------------------------------------

      const parsed =
        parseQuery(query);

      // ------------------------------------------------
      // Fetch Amazon-Backed Products
      // ------------------------------------------------

      const products =
        await productService.getProductsByMarketplace(
          Marketplace.AMAZON
        );

      // ------------------------------------------------
      // No Products
      // ------------------------------------------------

      if (products.length === 0) {
        return res.status(200).json({
          success: true,

          data: {
            best: null,

            recommendations: [],
          },

          meta: {
            query,

            marketplace:
              Marketplace.AMAZON,

            productCount: 0,
          },
        });
      }

      // ------------------------------------------------
      // Decision Engine
      // ------------------------------------------------

      const result =
        runEngine(
          parsed,
          products
        );

      // ------------------------------------------------
      // Response
      // ------------------------------------------------

      return res.status(200).json({
        success: true,

        data: result,

        meta: {
          query,

          marketplace:
            Marketplace.AMAZON,

          productCount:
            products.length,
        },
      });

    } catch (
      error: unknown
    ) {

      console.error(
        "Search error:",
        error
      );

      return res.status(500).json({
        success: false,

        error:
          "Internal server error",
      });
    }
  }
);

// ======================================================
// Compare
// ======================================================

searchRouter.post(
  "/compare",
  compareController
);