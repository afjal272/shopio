import { PrismaClient } from "@prisma/client";

import { runEngine } from "./modules/decision-engine/engine";

import { parseQuery } from "./modules/decision-engine/parser/queryParser";

import { mapProduct } from "./modules/decision-engine/utils/mapProduct";

const prisma = new PrismaClient();

const queries = [
  "best phone under 20000 for gaming",
  "camera phone under 25000",
  "best battery phone under 20000",
  "gaming phone under 15000",

  "best phone under 12000 for gaming",
  "camera phone under 18000",
  "best phone under 30000 for gaming and camera",
];

async function main() {

  const dbProducts =
    await prisma.product.findMany();

  const products =
    dbProducts.map(mapProduct);

  for (const query of queries) {

    console.log("\n==============================");

    console.log("QUERY:", query);

    const parsed =
      parseQuery(query);

    const result =
      runEngine(parsed, products);

    console.log(
      "BEST:",
      result.best?.name ?? "No Product"
    );

    console.log(
      "SCORE:",
      result.best?.score ?? "-"
    );

    console.log(
      "CONFIDENCE:",
      result.best?.confidence ?? "-"
    );

    console.log(
      "WHY:",
      result.best?.explanation ?? "-"
    );

    console.log("\nRECOMMENDATIONS:");

    result.recommendations.forEach(
      (product, index) => {

        console.log(
          `${index + 1}. ${product.name} (${product.score})`
        );

      }
    );

  }

  await prisma.$disconnect();

}

main().catch(async (error) => {

  console.error(error);

  await prisma.$disconnect();

  process.exit(1);

});