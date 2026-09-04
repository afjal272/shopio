import "dotenv/config";

import {
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

const FAILURE_SAMPLE_LIMIT = 20;

// ======================================================
// Types
// ======================================================

type Product = {
  id: string;
  name: string;
  description: string;
  tags: string[];
  highlights: string[];
  specs: unknown;
};

type Field =
  | "ram"
  | "storage"
  | "battery"
  | "processor"
  | "camera";

type Status =
  | "extracted"
  | "absent"
  | "failed";

type FieldCounts = Record<
  Status,
  number
>;

type Diagnostic = {
  id: string;
  title: string;
  sourceText: string;
  extracted: unknown;
  current: unknown;
};

// ======================================================
// Field Patterns
// ======================================================

const fieldPatterns: Record<
  Field,
  RegExp
> = {
  ram:
    /\b(?:ram|memory|\d{1,2}\s*(?:gb|gib)\s*(?:ram|memory)|\d{1,2}\s*,\s*gb)\b/i,

  storage:
    /\b(?:storage|rom|internal memory|\d{1,5}\s*(?:gb|gib|tb)\s*(?:storage|rom)?)\b/i,

  battery:
    /\b(?:battery|\d{4,5}\s*(?:mAh|milliamp))/i,

  processor:
    /\b(?:processor|cpu|chipset|soc|snapdragon|dimensity|helio|exynos|tensor|bionic|kirin|unisoc|spreadtrum|mediatek|apple\s+a\d+|octa[- ]?core|hexa[- ]?core|quad[- ]?core|deca[- ]?core|dual[- ]?core)\b/i,

  camera:
    /\b(?:camera|selfie|rear|front|\d{1,4}\s*(?:MP|megapixel))\b/i,
};

// ======================================================
// Generic Helpers
// ======================================================

function hasValue(
  value: unknown,
): boolean {
  return (
    (
      typeof value ===
        "number" &&
      Number.isFinite(
        value,
      ) &&
      value > 0
    ) ||
    (
      typeof value ===
        "string" &&
      value.trim().length > 0
    ) ||
    value === true
  );
}

function sourceText(
  product: Product,
): string {
  return [
    product.name,
    product.description,
    ...product.tags,
    ...product.highlights,
  ]
    .filter(
      (value) =>
        value.trim().length >
        0,
    )
    .join(" | ");
}

function fieldValue(
  field: Field,
  specs: Record<
    string,
    unknown
  >,
): unknown {
  switch (field) {
    case "ram":
      return specs.ram;

    case "storage":
      return specs.storage;

    case "battery":
      return specs.battery;

    case "processor":
      return (
        specs.chipset ??
        specs.processor ??
        specs.processorType
      );

    case "camera":
      return specs.cameraMp;

    default:
      return undefined;
  }
}

function classify(
  field: Field,
  product: Product,
  extracted: Record<
    string,
    unknown
  >,
): Status {
  if (
    hasValue(
      fieldValue(
        field,
        extracted,
      ),
    )
  ) {
    return "extracted";
  }

  return fieldPatterns[
    field
  ].test(
    sourceText(product),
  )
    ? "failed"
    : "absent";
}

function percentage(
  count: number,
  total: number,
): string {
  return total === 0
    ? "0.0%"
    : `${(
        (count / total) *
        100
      ).toFixed(1)}%`;
}

function toRecord(
  value: unknown,
): Record<
  string,
  unknown
> {
  if (
    typeof value ===
      "object" &&
    value !== null &&
    !Array.isArray(value)
  ) {
    return value as Record<
      string,
      unknown
    >;
  }

  return {};
}

function formatDiagnosticValue(
  value: unknown,
): string {
  try {
    return JSON.stringify(
      value,
      null,
      2,
    );
  } catch {
    return String(value);
  }
}

// ======================================================
// Main
// ======================================================

async function main(): Promise<void> {
  printHeader();

  const products =
    await prisma.product.findMany({
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

  const fields: Field[] = [
    "ram",
    "storage",
    "battery",
    "processor",
    "camera",
  ];

  const counts =
    createFieldCounts(
      fields,
    );

  const failureSamples: Record<
    Field,
    Diagnostic[]
  > = {
    ram: [],
    storage: [],
    battery: [],
    processor: [],
    camera: [],
  };

  let complete = 0;

  for (
    const product of products
  ) {
    /*
     * Validate against the authoritative textual source.
     *
     * Existing DB specs are deliberately NOT passed into the
     * normalization step. Otherwise stale values could hide
     * extraction failures.
     */
    const extracted =
      normalizeProductSpecs({
        name: product.name,

        description:
          product.description,

        tags: product.tags,

        highlights:
          product.highlights,
      });

    const current =
      toRecord(
        product.specs,
      );

    const source =
      sourceText(product);

    for (
      const field of fields
    ) {
      const status =
        classify(
          field,
          product,
          extracted,
        );

      counts[field][
        status
      ] += 1;

      if (
        status ===
          "failed" &&
        failureSamples[field]
          .length <
          FAILURE_SAMPLE_LIMIT
      ) {
        failureSamples[field].push(
          {
            id: product.id,

            title:
              product.name,

            sourceText:
              source,

            extracted:
              fieldValue(
                field,
                extracted,
              ),

            current:
              fieldValue(
                field,
                current,
              ),
          },
        );
      }
    }

    if (
      hasValue(
        fieldValue(
          "ram",
          current,
        ),
      ) &&
      hasValue(
        fieldValue(
          "battery",
          current,
        ),
      ) &&
      hasValue(
        fieldValue(
          "processor",
          current,
        ),
      )
    ) {
      complete += 1;
    }
  }

  printSummary(
    products.length,
    counts,
    complete,
  );

  printFailureDiagnostics(
    failureSamples,
  );
}

// ======================================================
// Counts
// ======================================================

function createFieldCounts(
  fields: Field[],
): Record<
  Field,
  FieldCounts
> {
  return Object.fromEntries(
    fields.map(
      (field) => [
        field,
        {
          extracted: 0,
          absent: 0,
          failed: 0,
        },
      ],
    ),
  ) as Record<
    Field,
    FieldCounts
  >;
}

// ======================================================
// Summary
// ======================================================

function printHeader(): void {
  console.log(
    "========================================",
  );

  console.log(
    "Shopio Product Specification Validation",
  );

  console.log(
    "========================================",
  );

  console.log("");
}

function printSummary(
  total: number,
  counts: Record<
    Field,
    FieldCounts
  >,
  complete: number,
): void {
  console.log(
    `Total products: ${total}`,
  );

  console.log("");

  for (
    const field of [
      "ram",
      "storage",
      "battery",
      "processor",
      "camera",
    ] as Field[]
  ) {
    const count =
      counts[field];

    console.log(
      `${field}: extracted ${count.extracted} (${percentage(
        count.extracted,
        total,
      )}), genuinely absent ${count.absent} (${percentage(
        count.absent,
        total,
      )}), present but failed ${count.failed} (${percentage(
        count.failed,
        total,
      )})`,
    );
  }

  console.log("");

  console.log(
    `Complete core specs: ${complete} (${percentage(
      complete,
      total,
    )})`,
  );

  console.log(
    `Missing core specs: ${
      total - complete
    } (${percentage(
      total - complete,
      total,
    )})`,
  );
}

// ======================================================
// Failure Diagnostics
// ======================================================

function printFailureDiagnostics(
  samples: Record<
    Field,
    Diagnostic[]
  >,
): void {
  for (
    const field of [
      "ram",
      "storage",
      "battery",
      "processor",
      "camera",
    ] as Field[]
  ) {
    const entries =
      samples[field];

    if (
      entries.length === 0
    ) {
      continue;
    }

    console.log("");

    console.log(
      "========================================",
    );

    console.log(
      `${field.toUpperCase()} FAILURE DIAGNOSTICS`,
    );

    console.log(
      "========================================",
    );

    console.log(
      `Showing up to ${FAILURE_SAMPLE_LIMIT} source-present but extraction-failed products.`,
    );

    for (
      const entry of entries
    ) {
      console.log("");

      console.log(
        "----------------------------------------",
      );

      console.log(
        `ID: ${entry.id}`,
      );

      console.log(
        `TITLE: ${entry.title}`,
      );

      console.log("");

      console.log(
        "SOURCE TEXT:",
      );

      console.log(
        entry.sourceText,
      );

      console.log("");

      console.log(
        "EXTRACTED VALUE:",
      );

      console.log(
        formatDiagnosticValue(
          entry.extracted,
        ),
      );

      console.log("");

      console.log(
        "CURRENT DATABASE VALUE:",
      );

      console.log(
        formatDiagnosticValue(
          entry.current,
        ),
      );
    }
  }
}

// ======================================================
// Error Handling
// ======================================================

main()
  .catch(
    (error: unknown) => {
      console.error("");

      console.error(
        "Specification validation failed.",
      );

      console.error(
        error instanceof Error
          ? error.message
          : error,
      );

      process.exitCode =
        1;
    },
  )
  .finally(
    async () => {
      await prisma.$disconnect();
    },
  );