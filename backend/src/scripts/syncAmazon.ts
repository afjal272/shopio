import "dotenv/config";

import {
  productSyncService,
  ProductSyncResult,
} from "../services/product-sync.service";

// ======================================================
// Configuration
// ======================================================

const DEFAULT_QUERY = "smartphone";

const DEFAULT_COUNTRY = "IN";

const DEFAULT_START_PAGE = 1;

const DEFAULT_MAX_PAGES = 10;

// ======================================================
// Environment Validation
// ======================================================

function validateEnvironment(): void {
  const requiredVariables = [
    "RAPIDAPI_KEY",
    "RAPIDAPI_HOST",
  ];

  const missingVariables =
    requiredVariables.filter(
      (variable) =>
        !process.env[variable]?.trim()
    );

  if (missingVariables.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingVariables.join(
        ", "
      )}`
    );
  }
}

// ======================================================
// Main Sync
// ======================================================

async function main(): Promise<void> {
  console.log(
    "Starting Amazon product synchronization..."
  );

  validateEnvironment();

  const query =
    process.env.AMAZON_SYNC_QUERY?.trim() ||
    DEFAULT_QUERY;

  const country =
    process.env.AMAZON_SYNC_COUNTRY?.trim() ||
    DEFAULT_COUNTRY;

  const startPage =
    parsePositiveInteger(
      process.env.AMAZON_SYNC_PAGE
    ) ?? DEFAULT_START_PAGE;

  const maxPages =
    parsePositiveInteger(
      process.env.AMAZON_SYNC_MAX_PAGES
    ) ?? DEFAULT_MAX_PAGES;

  console.log(
    `Amazon query: "${query}"`
  );

  console.log(
    `Amazon country: ${country}`
  );

  console.log(
    `Amazon start page: ${startPage}`
  );

  console.log(
    `Amazon maximum pages: ${maxPages}`
  );

  // ====================================================
  // Aggregate Result
  // ====================================================

  const aggregate =
    createAggregateResult();

  // ====================================================
  // Paginated Synchronization
  // ====================================================

  let hasNextPage = true;

  let pagesProcessed = 0;

  for (
    let page = startPage;
    page < startPage + maxPages;
    page += 1
  ) {
    console.log(
      `\nSynchronizing Amazon page ${page}...`
    );

    let result: ProductSyncResult;

    try {
      result =
        await productSyncService.syncAmazonProducts({
          query,
          country,
          page,
        });
    } catch (error: unknown) {
      const message =
        getErrorMessage(error);

      console.error(
        `Amazon page ${page} failed: ${message}`
      );

      aggregate.failed += 1;

      aggregate.errors.push({
        externalId: `page:${page}`,
        message,
      });

      /*
       * Do not continue to the next page after a page-level
       * synchronization failure. Otherwise we could silently
       * create gaps in the synchronized dataset.
       */
      break;
    }

    pagesProcessed += 1;

    // --------------------------------------------------
    // Aggregate Counters
    // --------------------------------------------------

    aggregate.requested +=
      result.requested;

    aggregate.processed +=
      result.processed;

    aggregate.succeeded +=
      result.succeeded;

    aggregate.failed +=
      result.failed;

    aggregate.skipped +=
      result.skipped;

    aggregate.errors.push(
      ...result.errors
    );

    // --------------------------------------------------
    // Pagination State
    // --------------------------------------------------

    hasNextPage =
      result.hasNextPage;

    aggregate.hasNextPage =
      hasNextPage;

    // --------------------------------------------------
    // Page Result
    // --------------------------------------------------

    console.log(
      `Page ${page}: ` +
        `Requested=${result.requested}, ` +
        `Processed=${result.processed}, ` +
        `Succeeded=${result.succeeded}, ` +
        `Skipped=${result.skipped}, ` +
        `Failed=${result.failed}, ` +
        `HasNextPage=${result.hasNextPage}`
    );

    // --------------------------------------------------
    // Empty Page
    // --------------------------------------------------

    if (result.requested === 0) {
      console.log(
        `No products returned on page ${page}.`
      );

      break;
    }

    // --------------------------------------------------
    // Last Page
    // --------------------------------------------------

    if (!result.hasNextPage) {
      console.log(
        `Amazon reported no next page after page ${page}.`
      );

      break;
    }

    // --------------------------------------------------
    // Page-Level Failures
    // --------------------------------------------------

    if (result.failed > 0) {
      console.error(
        `Page ${page} completed with synchronization failures.`
      );

      /*
       * Stop pagination because continuing after partial
       * synchronization failures can produce an incomplete
       * or inconsistent dataset.
       */
      break;
    }
  }

  // ====================================================
  // Maximum Page Limit
  // ====================================================

  if (
    hasNextPage &&
    pagesProcessed >= maxPages
  ) {
    console.log(
      `Maximum page limit reached (${maxPages}).`
    );

    console.log(
      "Additional Amazon pages are available but were not synchronized."
    );
  }

  // ====================================================
  // Final Result
  // ====================================================

  console.log(
    "\n================================"
  );

  console.log(
    "Amazon synchronization completed."
  );

  console.log(
    `Pages processed: ${pagesProcessed}`
  );

  console.log(
    `Requested: ${aggregate.requested}`
  );

  console.log(
    `Processed: ${aggregate.processed}`
  );

  console.log(
    `Succeeded: ${aggregate.succeeded}`
  );

  console.log(
    `Skipped: ${aggregate.skipped}`
  );

  console.log(
    `Failed: ${aggregate.failed}`
  );

  console.log(
    `Has next page: ${aggregate.hasNextPage}`
  );

  // ====================================================
  // Synchronization Errors
  // ====================================================

  if (aggregate.errors.length > 0) {
    console.error(
      "\nSynchronization errors:"
    );

    for (const error of aggregate.errors) {
      console.error(
        `- ${error.externalId}: ${error.message}`
      );
    }
  }

  // ====================================================
  // Process Exit
  // ====================================================

  if (aggregate.failed > 0) {
    process.exitCode = 1;
  }
}

// ======================================================
// Aggregate Result
// ======================================================

function createAggregateResult(): ProductSyncResult {
  return {
    marketplace: "AMAZON",

    requested: 0,

    processed: 0,

    succeeded: 0,

    failed: 0,

    skipped: 0,

    errors: [],

    hasNextPage: false,
  };
}

// ======================================================
// Integer Parser
// ======================================================

function parsePositiveInteger(
  value: string | undefined
): number | null {
  if (!value?.trim()) {
    return null;
  }

  const parsed =
    Number(value);

  if (
    !Number.isInteger(parsed) ||
    parsed < 1
  ) {
    return null;
  }

  return parsed;
}

// ======================================================
// Error Handling
// ======================================================

function getErrorMessage(
  error: unknown
): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  return "Unknown Amazon synchronization error";
}

// ======================================================
// Execute
// ======================================================

void main().catch(
  (error: unknown) => {
    console.error(
      "Amazon synchronization failed:",
      getErrorMessage(error)
    );

    process.exitCode = 1;
  }
);