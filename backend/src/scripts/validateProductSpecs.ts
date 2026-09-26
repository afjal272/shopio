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
// Source Evidence Patterns
// ======================================================
//
// These patterns intentionally look for USABLE specification
// evidence, not generic words.
//
// Example:
//   "Long Battery Life"       -> absent
//   "7000mAhA"                -> failed if mapper misses it
//   "Triple Camera"           -> absent
//   "200MPCamera"             -> failed if mapper misses it
//   "Powerful Snapdragon"     -> absent
//   "Snapdragon 8 Gen 5"      -> failed if mapper misses it
//
// This prevents the validator from treating vague marketing
// language as an extraction failure.
// ======================================================

const fieldEvidencePatterns: Record<
  Field,
  readonly RegExp[]
> = {
  ram: [
    /*
     * Explicit RAM label:
     * RAM: 8GB
     * Memory: 12GB
     * System Memory: 16GB
     */
    /\b(?:ram|memory|system\s+memory|installed\s+memory|ram\s+size|memory\s+size)\s*[:=\-]?\s*\d{1,2}(?:\.\d+)?\s*(?:gb|gib)\b/i,

    /*
     * Value before label:
     * 8GB RAM
     * 12GB Memory
     * 16GB Unified Memory
     */
    /\b\d{1,2}(?:\.\d+)?\s*(?:gb|gib)\s*(?:ram|memory|unified\s+memory)\b/i,

    /*
     * Compact memory/storage:
     * 6+128GB
     * 8/256GB
     */
    /\b\d{1,2}\s*(?:\+|\/|\|)\s*\d{2,5}(?:\.\d+)?\s*(?:gb|gib|tb)\b/i,

    /*
     * Explicit two-capacity compact notation:
     * 8GB+128GB
     * 128GB+8GB
     */
    /\b\d{1,5}(?:\.\d+)?\s*(?:gb|gib|tb)\s*(?:\+|\/|\|)\s*\d{1,5}(?:\.\d+)?\s*(?:gb|gib|tb)\b/i,

    /*
     * Amazon-style:
     * 12, GB, 256
     */
    /\b\d{1,2}\s*,\s*gb\s*,\s*\d{2,5}\b/i,
  ],

  storage: [
    /*
     * Explicit storage labels:
     * Storage: 256GB
     * ROM: 128GB
     * Internal Storage: 1TB
     */
    /\b(?:storage|rom|internal\s+memory|internal\s+storage|built[\s-]?in\s+storage|storage\s+capacity|memory\s+capacity)\s*[:=\-]?\s*\d{1,5}(?:\.\d+)?\s*(?:gb|gib|tb)\b/i,

    /*
     * Value before storage label:
     * 256GB Storage
     * 128GB ROM
     * 1TB Internal Storage
     */
    /\b\d{1,5}(?:\.\d+)?\s*(?:gb|gib|tb)\s*(?:storage|rom|internal\s+storage|internal\s+memory)\b/i,

    /*
     * RAM + Storage:
     * 8GB RAM 256GB
     * 8GB RAM 256GB Storage
     */
    /\b\d{1,2}(?:\.\d+)?\s*(?:gb|gib)\s+ram\s+(\d{1,5}(?:\.\d+)?)\s*(?:gb|gib|tb)\b/i,

    /*
     * Compact:
     * 8+256GB
     * 8/256GB
     */
    /\b\d{1,2}\s*(?:\+|\/|\|)\s*\d{2,5}(?:\.\d+)?\s*(?:gb|gib|tb)\b/i,

    /*
     * Explicit dual-capacity notation:
     * 8GB+256GB
     * 256GB+8GB
     */
    /\b\d{1,5}(?:\.\d+)?\s*(?:gb|gib|tb)\s*(?:\+|\/|\|)\s*\d{1,5}(?:\.\d+)?\s*(?:gb|gib|tb)\b/i,

    /*
     * Standalone standard storage sizes.
     *
     * Restricted to real storage capacities so that
     * "8GB RAM" is not incorrectly counted as storage evidence.
     */
    /\b(?:16|32|64|128|256|512|1024|2048|4096|8192|16384)\s*(?:gb|gib|tb)\b/i,
  ],

  battery: [
    /*
     * Explicit:
     * Battery: 5000mAh
     * Battery Capacity: 7000mAh
     * Rated Capacity: 6580mAh
     */
    /\b(?:battery|battery\s+capacity|battery\s+size|rated\s+capacity)\s*[:=\-]?\s*\d{1,2}(?:,\d{3}){1,2}|\b(?:battery|battery\s+capacity|battery\s+size|rated\s+capacity)\s*[:=\-]?\s*\d{4,5}\s*(?:mah|milliamp(?:-?hours?))\b/i,

    /*
     * Standalone:
     * 5000mAh
     * 7000mAhA
     * 6580mAhSi/C
     */
    /\b\d{1,2}(?:,\d{3}){1,2}\s*(?:mah|milliamp(?:-?hours?))(?:[a-z\/\s-]*)?/i,

    /\b\d{4,5}\s*(?:mah|milliamp(?:-?hours?))(?:[a-z\/\s-]*)?/i,
  ],

  processor: [
    /*
     * Qualcomm Snapdragon:
     * Snapdragon 8 Gen 3
     * Snapdragon 8 Elite
     * Snapdragon 6s Gen 4
     * Snapdragon 7+ Gen 3
     */
    /\bsnapdragon\s+\d+[a-z0-9+.-]*(?:\s+gen\s*\d+)?(?:\s+(?:elite|pro|plus|ultra|prime))?(?:\s+for\s+[a-z]+)?\b/i,

    /*
     * Qualcomm shorthand:
     * SD4 Gen2
     */
    /\bsd\d+\s*gen\s*\d+\b/i,

    /*
     * Snapdragon-style shorthand without the brand:
     * 6s Gen 4
     * 6s Gen 3
     */
    /\b\d+s\s+gen\s+\d+\b/i,

    /*
     * MediaTek Dimensity:
     */
    /\bdimensity\s+\d+[a-z0-9+.-]*(?:\s+(?:ultra|max|pro|plus|apex|extreme))?(?:\s+for\s+(?:gaming|mobile))?\b/i,

    /*
     * MediaTek D-series:
     * MediaTek D8400 MAX
     * MediaTek D8300
     */
    /\bmediatek\s+d\d+[a-z0-9+.-]*(?:\s+(?:max|ultra|pro|plus|apex|extreme))?\b/i,

    /*
     * MediaTek numeric:
     * MediaTek 7300-Max
     */
    /\bmediatek\s+\d+[a-z0-9+.-]*(?:[-\s](?:max|ultra|pro|plus|apex|extreme))?\b/i,

    /*
     * Helio:
     */
    /\b(?:mediatek\s+)?helio\s+[a-z]?\d+[a-z0-9+.-]*\b/i,

    /*
     * Samsung Exynos:
     */
    /\bexynos\s+\d+[a-z0-9+.-]*\b/i,

    /*
     * Google Tensor:
     */
    /\btensor\s+g\d+(?:\s+(?:pro|tensor))?\b/i,

    /*
     * Apple A-series:
     * A19 Pro Chip
     * Apple A19 Pro
     */
    /\b(?:apple\s+)?a\d+(?:\s+(?:bionic|pro|fusion))?\s+(?:chip|processor)\b/i,

    /\bapple\s+a\d+(?:\s+(?:bionic|pro|fusion))?\b/i,

    /*
     * Huawei Kirin:
     */
    /\bkirin\s+\d+[a-z0-9+.-]*\b/i,

    /*
     * Unisoc / Spreadtrum:
     */
    /\b(?:unisoc|spreadtrum)\s+[a-z0-9-]+\b/i,

    /*
     * Generic processor model explicitly named:
     * Processor 7 Gen 3
     */
    /\bprocessor\s*[:=\-]?\s*(?:\d+[a-z0-9+.-]*|[a-z]+\d+[a-z0-9+.-]*)\b/i,
  ],

  camera: [
    /*
     * Explicit megapixel values:
     * 50MP
     * 200MP
     * 12.5MP
     */
    /\b\d{1,4}(?:\.\d+)?\s*(?:mp|megapixel|master\s*pixel)(?:\b|(?=[a-z]))/i,
  ],
};

// ======================================================
// Generic Helpers
// ======================================================

function hasValue(
  value: unknown,
): boolean {
  if (
    typeof value ===
      "number"
  ) {
    return (
      Number.isFinite(value) &&
      value > 0
    );
  }

  if (
    typeof value ===
      "string"
  ) {
    return (
      value.trim().length > 0
    );
  }

  return value === true;
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
      (
        value,
      ) =>
        typeof value ===
          "string" &&
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

function hasSourceEvidence(
  field: Field,
  text: string,
): boolean {
  return fieldEvidencePatterns[
    field
  ].some(
    (pattern) =>
      pattern.test(text),
  );
}

function classify(
  field: Field,
  product: Product,
  extracted: Record<
    string,
    unknown
  >,
): Status {
  /*
   * First priority:
   * canonical normalized extraction succeeded.
   */
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

  /*
   * Second priority:
   * source contains enough concrete evidence that the
   * canonical extractor should have produced a value.
   *
   * This is a genuine extraction failure.
   */
  if (
    hasSourceEvidence(
      field,
      sourceText(product),
    )
  ) {
    return "failed";
  }

  /*
   * No concrete specification evidence exists in the
   * persisted source fields.
   */
  return "absent";
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
    const serialized =
      JSON.stringify(
        value,
        null,
        2,
      );

    return (
      serialized ??
      String(value)
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

  /*
   * Completeness is calculated from canonical extraction,
   * not the existing DB values.
   *
   * This is important because legacy/stale DB values must
   * never make the normalized source appear complete.
   */
  let complete = 0;

  for (
    const product of products
  ) {
    /*
     * IMPORTANT:
     *
     * Existing DB specs are intentionally NOT supplied to
     * normalizeProductSpecs().
     *
     * This validates what the canonical extractor can recover
     * from the persisted source fields alone.
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

    /*
     * A product is considered to have complete core
     * specifications only when ALL five canonical fields
     * were extracted from the source:
     *
     * RAM
     * Storage
     * Battery
     * Processor
     * Camera
     */
    if (
      hasValue(
        fieldValue(
          "ram",
          extracted,
        ),
      ) &&
      hasValue(
        fieldValue(
          "storage",
          extracted,
        ),
      ) &&
      hasValue(
        fieldValue(
          "battery",
          extracted,
        ),
      ) &&
      hasValue(
        fieldValue(
          "processor",
          extracted,
        ),
      ) &&
      hasValue(
        fieldValue(
          "camera",
          extracted,
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
    "BeforeChoice Product Specification Validation",
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
      entries.length ===
      0
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
      `Showing up to ${FAILURE_SAMPLE_LIMIT} products where the persisted source contains concrete ${field} evidence but canonical extraction returned no value.`,
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

      process.exitCode = 1;
    },
  )
  .finally(
    async () => {
      await prisma.$disconnect();
    },
  );