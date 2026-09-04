import "dotenv/config";

import {
  Prisma,
  PrismaClient,
} from "@prisma/client";

import {
  normalizeProductSpecs,
} from "../integrations/amazon/amazon.mapper";

// ======================================================
// Configuration
// ======================================================

const prisma =
  new PrismaClient();

const BATCH_SIZE = 50;

const PROGRESS_INTERVAL = 25;

// ======================================================
// Types
// ======================================================

type ProductSource = {
  id: string;
  name: string;
  description: string;
  tags: string[];
  highlights: string[];
  specs: unknown;
};

type RebuildStats = {
  total: number;
  processed: number;
  updated: number;
  unchanged: number;
  failed: number;
};

type JsonRecord = Record<
  string,
  unknown
>;

// ======================================================
// Main
// ======================================================

async function main(): Promise<void> {
  printHeader();

  const products =
    await loadProducts();

  const stats: RebuildStats = {
    total: products.length,
    processed: 0,
    updated: 0,
    unchanged: 0,
    failed: 0,
  };

  console.log(
    `Products found: ${stats.total}`,
  );

  console.log("");

  if (
    products.length === 0
  ) {
    console.log(
      "No products require specification rebuilding.",
    );

    return;
  }

  for (
    let offset = 0;
    offset < products.length;
    offset += BATCH_SIZE
  ) {
    const batch =
      products.slice(
        offset,
        offset + BATCH_SIZE,
      );

    await processBatch(
      batch,
      stats,
    );

    printProgress(stats);
  }

  printSummary(stats);

  if (
    stats.failed > 0
  ) {
    throw new Error(
      `Specification rebuild completed with ${stats.failed} failed product(s).`,
    );
  }
}

// ======================================================
// Database Loading
// ======================================================

async function loadProducts(): Promise<
  ProductSource[]
> {
  return prisma.product.findMany({
    orderBy: {
      id: "asc",
    },

    select: {
      id: true,
      name: true,
      description: true,
      tags: true,
      highlights: true,
      specs: true,
    },
  });
}

// ======================================================
// Batch Processing
// ======================================================

async function processBatch(
  products: ProductSource[],
  stats: RebuildStats,
): Promise<void> {
  const updates: Array<{
    id: string;
    specs: Prisma.InputJsonObject;
  }> = [];

  for (
    const product of products
  ) {
    stats.processed += 1;

    try {
      /*
       * IMPORTANT:
       *
       * Rebuild from the authoritative product source only.
       *
       * We intentionally DO NOT pass product.specs to
       * normalizeProductSpecs() here.
       *
       * Otherwise a stale value such as:
       *
       *   existing RAM = 64
       *   source RAM    = 4
       *
       * can incorrectly preserve the old 64GB value.
       */
      const sourceNormalized =
        normalizeProductSpecs({
          name: product.name,
          description:
            product.description,
          tags: product.tags,
          highlights:
            product.highlights,
        });

      /*
       * Existing fields are retained ONLY when the fresh
       * source normalization did not produce a value.
       *
       * This gives source-derived values authority while
       * preventing unrelated structured metadata from being
       * destroyed during a rebuild.
       */
      const normalized =
        mergeSourceAndExistingSpecs(
          sourceNormalized,
          product.specs,
        );

      /*
       * processorScore is a derived decision-engine field.
       * It must never survive specification rebuilding.
       */
      delete normalized.processorScore;

      if (
        jsonEqual(
          product.specs,
          normalized,
        )
      ) {
        stats.unchanged +=
          1;

        continue;
      }

      updates.push({
        id: product.id,

        specs:
          normalized as Prisma.InputJsonObject,
      });
    } catch (
      error: unknown
    ) {
      stats.failed += 1;

      console.error(
        `\nFailed to normalize product ${product.id}: ${getErrorMessage(
          error,
        )}`,
      );
    }
  }

  if (
    updates.length === 0
  ) {
    return;
  }

  /*
   * All normalization is completed before the transaction begins.
   *
   * The transaction keeps the database consistent at batch level:
   * either all updates succeed or none of them are committed.
   */
  try {
    await prisma.$transaction(
      updates.map(
        (update) =>
          prisma.product.update({
            where: {
              id: update.id,
            },

            data: {
              specs:
                update.specs,
            },
          }),
      ),
    );

    stats.updated +=
      updates.length;
  } catch (
    error: unknown
  ) {
    /*
     * No update from this transaction should be counted as
     * successful because Prisma rolled the transaction back.
     */
    stats.failed +=
      updates.length;

    console.error(
      `\nDatabase batch update failed for ${updates.length} product(s): ${getErrorMessage(
        error,
      )}`,
    );
  }
}

// ======================================================
// Specification Merge
// ======================================================

function mergeSourceAndExistingSpecs(
  sourceNormalized: Record<
    string,
    unknown
  >,
  existingSpecs: unknown,
): Record<
  string,
  Prisma.JsonValue
> {
  const source =
    sanitizeJsonRecord(
      sourceNormalized,
    );

  const existing =
    sanitizeJsonRecord(
      existingSpecs,
    );

  /*
   * Source-derived values always win.
   *
   * Existing fields are only used as fallback when the new
   * normalization could not extract that field.
   */
  const merged: Record<
    string,
    Prisma.JsonValue
  > = {
    ...existing,
    ...source,
  };

  /*
   * Derived score must never live inside normalized specs.
   */
  delete merged.processorScore;

  return merged;
}

// ======================================================
// JSON Sanitization
// ======================================================

function sanitizeJsonRecord(
  value: unknown,
): Record<
  string,
  Prisma.JsonValue
> {
  if (
    !isRecord(value)
  ) {
    return {};
  }

  const result: Record<
    string,
    Prisma.JsonValue
  > = {};

  for (
    const [
      key,
      child,
    ] of Object.entries(value)
  ) {
    if (
      key ===
      "processorScore"
    ) {
      continue;
    }

    const sanitized =
      sanitizeJsonValue(
        child,
      );

    if (
      sanitized !==
      undefined
    ) {
      result[key] =
        sanitized;
    }
  }

  return result;
}

function sanitizeJsonValue(
  value: unknown,
): Prisma.JsonValue | undefined {
  if (
    value === null
  ) {
    return null;
  }

  if (
    typeof value ===
      "string" ||
    typeof value ===
      "boolean"
  ) {
    return value;
  }

  if (
    typeof value ===
    "number"
  ) {
    return Number.isFinite(
      value,
    )
      ? value
      : undefined;
  }

  if (
    Array.isArray(value)
  ) {
    const result: Prisma.JsonValue[] =
      [];

    for (
      const child of value
    ) {
      const sanitized =
        sanitizeJsonValue(
          child,
        );

      if (
        sanitized !==
        undefined
      ) {
        result.push(
          sanitized,
        );
      }
    }

    return result;
  }

  if (
    isRecord(value)
  ) {
    const result: Record<
      string,
      Prisma.JsonValue
    > = {};

    for (
      const [
        key,
        child,
      ] of Object.entries(value)
    ) {
      if (
        key ===
        "processorScore"
      ) {
        continue;
      }

      const sanitized =
        sanitizeJsonValue(
          child,
        );

      if (
        sanitized !==
        undefined
      ) {
        result[key] =
          sanitized;
      }
    }

    return result;
  }

  return undefined;
}

function isRecord(
  value: unknown,
): value is JsonRecord {
  return (
    typeof value ===
      "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

// ======================================================
// Progress
// ======================================================

function printProgress(
  stats: RebuildStats,
): void {
  if (
    stats.processed %
      PROGRESS_INTERVAL !==
      0 &&
    stats.processed !==
      stats.total
  ) {
    return;
  }

  const percentage =
    stats.total === 0
      ? "100.0"
      : (
          (stats.processed /
            stats.total) *
          100
        ).toFixed(1);

  console.log(
    `Progress: ${stats.processed}/${stats.total} (${percentage}%) | ` +
      `Updated=${stats.updated} | ` +
      `Unchanged=${stats.unchanged} | ` +
      `Failed=${stats.failed}`,
  );
}

// ======================================================
// JSON Equality
// ======================================================

function jsonEqual(
  left: unknown,
  right: unknown,
): boolean {
  return (
    stableSerialize(
      left,
    ) ===
    stableSerialize(
      right,
    )
  );
}

function stableSerialize(
  value: unknown,
): string {
  return JSON.stringify(
    sortJsonValue(
      value,
    ),
  );
}

function sortJsonValue(
  value: unknown,
): unknown {
  if (
    Array.isArray(value)
  ) {
    return value.map(
      sortJsonValue,
    );
  }

  if (
    value !== null &&
    typeof value ===
      "object"
  ) {
    const record =
      value as Record<
        string,
        unknown
      >;

    return Object.keys(
      record,
    )
      .sort()
      .reduce(
        (
          result,
          key,
        ) => {
          result[key] =
            sortJsonValue(
              record[key],
            );

          return result;
        },
        {} as Record<
          string,
          unknown
        >,
      );
  }

  return value;
}

// ======================================================
// Summary
// ======================================================

function printHeader(): void {
  console.log(
    "========================================",
  );

  console.log(
    "Shopio Product Specification Rebuild",
  );

  console.log(
    "========================================",
  );

  console.log("");
}

function printSummary(
  stats: RebuildStats,
): void {
  console.log("");

  console.log(
    "========================================",
  );

  console.log(
    "Specification Rebuild Completed",
  );

  console.log(
    "========================================",
  );

  console.log(
    `Total products:       ${stats.total}`,
  );

  console.log(
    `Processed:            ${stats.processed}`,
  );

  console.log(
    `Updated:              ${stats.updated}`,
  );

  console.log(
    `Unchanged:            ${stats.unchanged}`,
  );

  console.log(
    `Failed:               ${stats.failed}`,
  );

  console.log(
    "========================================",
  );
}

// ======================================================
// Error Handling
// ======================================================

function getErrorMessage(
  error: unknown,
): string {
  if (
    error instanceof Error
  ) {
    return error.message;
  }

  if (
    typeof error ===
    "string"
  ) {
    return error;
  }

  try {
    return JSON.stringify(
      error,
    );
  } catch {
    return "Unknown error";
  }
}

// ======================================================
// Graceful Shutdown
// ======================================================

let shutdownStarted =
  false;

async function shutdown(
  exitCode: number,
): Promise<void> {
  if (
    shutdownStarted
  ) {
    return;
  }

  shutdownStarted =
    true;

  try {
    await prisma.$disconnect();
  } finally {
    process.exitCode =
      exitCode;
  }
}

process.once(
  "SIGINT",
  () => {
    console.error(
      "\nSpecification rebuild interrupted by SIGINT.",
    );

    void shutdown(
      130,
    );
  },
);

process.once(
  "SIGTERM",
  () => {
    console.error(
      "\nSpecification rebuild interrupted by SIGTERM.",
    );

    void shutdown(
      143,
    );
  },
);

// ======================================================
// Execute
// ======================================================

void main()
  .then(() =>
    shutdown(0),
  )
  .catch(
    async (
      error: unknown,
    ) => {
      console.error("");

      console.error(
        "Specification rebuild failed.",
      );

      console.error(
        getErrorMessage(
          error,
        ),
      );

      await shutdown(
        1,
      );
    },
  );