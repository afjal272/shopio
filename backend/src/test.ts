import { PrismaClient } from "@prisma/client";

import { runEngine } from "./modules/decision-engine/engine";

import { parseQuery } from "./modules/decision-engine/parser/queryParser";

import { mapProduct } from "./modules/decision-engine/utils/mapProduct";

// ======================================================
// Prisma
// ======================================================

const prisma =
  new PrismaClient();

// ======================================================
// Test Queries
// ======================================================

const queries: readonly string[] = [
  "best phone under 20000 for gaming",
  "camera phone under 25000",
  "best battery phone under 20000",
  "gaming phone under 15000",

  "best phone under 12000 for gaming",
  "camera phone under 18000",
  "best phone under 30000 for gaming and camera",
];

// ======================================================
// Main
// ======================================================

async function main(): Promise<void> {

  // ====================================================
  // Fetch Products With Marketplace Offers
  // ====================================================

  const dbProducts =
    await prisma.product.findMany({
      include: {
        offers: {
          orderBy: {
            updatedAt: "desc",
          },
        },
      },

      orderBy: {
        updatedAt: "desc",
      },
    });

  // ====================================================
  // Map Database Products
  // ====================================================

  const products =
    dbProducts.map(mapProduct);

  console.log(
    `Loaded ${products.length} products.`
  );

  // ====================================================
  // Run Decision Engine
  // ====================================================

  for (
    const query of queries
  ) {

    console.log(
      "\n=============================="
    );

    console.log(
      "QUERY:",
      query
    );

    // --------------------------------------------------
    // Parse Query
    // --------------------------------------------------

    const parsed =
      parseQuery(query);

    // --------------------------------------------------
    // Run Engine
    // --------------------------------------------------

    const result =
      runEngine(
        parsed,
        products
      );

    // --------------------------------------------------
    // Best Product
    // --------------------------------------------------

    console.log(
      "BEST:",
      result.best?.name ??
        "No Product"
    );

    console.log(
      "SCORE:",
      result.best?.score ??
        "-"
    );

    console.log(
      "CONFIDENCE:",
      result.best?.confidence ??
        "-"
    );

    console.log(
      "WHY:",
      result.best?.explanation ??
        "-"
    );

    // --------------------------------------------------
    // Recommendations
    // --------------------------------------------------

    console.log(
      "\nRECOMMENDATIONS:"
    );

    if (
      result.recommendations.length === 0
    ) {

      console.log(
        "No recommendations available."
      );

      continue;
    }

    result.recommendations.forEach(
      (
        product,
        index
      ) => {

        console.log(
          `${index + 1}. ${product.name} (${product.score})`
        );

      }
    );
  }
}

// ======================================================
// Application Lifecycle
// ======================================================

async function bootstrap(): Promise<void> {

  try {

    await main();

  } catch (
    error: unknown
  ) {

    console.error(
      "Decision engine test failed:",
      error
    );

    process.exitCode = 1;

  } finally {

    await prisma.$disconnect();

  }
}

void bootstrap();