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
  IntentType,
  WeightedIntent,
} from "../../modules/decision-engine/types";

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
// Supported UI Intents
// ======================================================

const SUPPORTED_INTENTS: readonly IntentType[] = [
  "gaming",
  "camera",
  "battery",
  "balanced",
];

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

      // ==================================================
      // Query
      // ==================================================

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

      // ==================================================
      // Parse User Query
      // ==================================================

      const parsed =
        parseQuery(query);

      // ==================================================
      // Apply Explicit UI Intent
      // ==================================================

      const requestedIntent =
        parseRequestedIntent(
          req.query.intent
        );

      if (
        requestedIntent.length > 0
      ) {
        parsed.intent =
          requestedIntent;

        parsed.weightedIntent =
          createWeightedIntent(
            requestedIntent
          );
      }

      // ==================================================
      // Fetch Amazon-Backed Products
      // ==================================================

      const products =
        await productService.getProductsByMarketplace(
          Marketplace.AMAZON
        );

      // ==================================================
      // No Products
      // ==================================================

      if (products.length === 0) {
        return res.status(200).json({
          success: true,

          data: {
            best: null,

            recommendations: [],

            parsed,

            comparison: [],

            notRecommended: [],

            suggestions: [],

            isRelaxed: false,
          },

          meta: {
            query,

            marketplace:
              Marketplace.AMAZON,

            productCount: 0,

            intent:
              parsed.intent,
          },
        });
      }

      // ==================================================
      // Decision Engine
      // ==================================================

      const result =
        runEngine(
          parsed,
          products
        );

      // ==================================================
      // Response
      // ==================================================

      return res.status(200).json({
        success: true,

        data: result,

        meta: {
          query,

          marketplace:
            Marketplace.AMAZON,

          productCount:
            products.length,

          intent:
            parsed.intent,
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

// ======================================================
// Intent Parser
// ======================================================

function parseRequestedIntent(
  value: unknown
): IntentType[] {

  if (
    typeof value !== "string"
  ) {
    return [];
  }

  const values =
    value
      .split(",")
      .map(
        (item) =>
          item.trim().toLowerCase()
      )
      .filter(Boolean);

  const validIntents =
    values.filter(
      (
        item
      ): item is IntentType =>
        SUPPORTED_INTENTS.includes(
          item as IntentType
        )
    );

  return [
    ...new Set(
      validIntents
    ),
  ];
}

// ======================================================
// Weighted Intent Builder
// ======================================================

function createWeightedIntent(
  intents: IntentType[]
): WeightedIntent[] {

  if (
    intents.length === 0
  ) {
    return [
      {
        type: "balanced",
        weight: 1,
      },
    ];
  }

  const weight =
    1 / intents.length;

  return intents.map(
    (type) => ({
      type,
      weight,
    })
  );
}