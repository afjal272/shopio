"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useSyncExternalStore,
} from "react";
import { Heart } from "lucide-react";
import { toast } from "sonner";

import { ProductItem } from "@/types/search";

// ======================================================
// Types
// ======================================================

type Props = {
  item: ProductItem;
  index?: number;
  highlight?: boolean;
  selected?: boolean;
  onSelect?: () => void;
};

// ======================================================
// Constants
// ======================================================

const SAVED_PRODUCTS_KEY =
  "saved_products";

const COMPARE_IDS_KEY =
  "compare_ids";

const SAVED_PRODUCTS_EVENT =
  "shopio:saved-products";

const COMPARE_IDS_EVENT =
  "shopio:compare-ids";

const MAX_COMPARE_PRODUCTS = 4;

// ======================================================
// Local Storage Helpers
// ======================================================

function readIdList(
  key: string,
): string[] {
  if (
    typeof window ===
    "undefined"
  ) {
    return [];
  }

  try {
    const raw =
      localStorage.getItem(key);

    if (!raw) {
      return [];
    }

    const parsed: unknown =
      JSON.parse(raw);

    if (
      !Array.isArray(parsed)
    ) {
      return [];
    }

    return Array.from(
      new Set(
        parsed
          .map((value) =>
            String(value),
          )
          .filter(Boolean),
      ),
    );
  } catch {
    return [];
  }
}

function writeIdList(
  key: string,
  ids: string[],
): void {
  if (
    typeof window ===
    "undefined"
  ) {
    return;
  }

  localStorage.setItem(
    key,
    JSON.stringify(
      Array.from(
        new Set(ids),
      ),
    ),
  );
}

function emitLocalStorageEvent(
  eventName: string,
): void {
  if (
    typeof window ===
    "undefined"
  ) {
    return;
  }

  window.dispatchEvent(
    new Event(eventName),
  );
}

// ======================================================
// External Store
// ======================================================

function subscribeToEvent(
  eventName: string,
  callback: () => void,
): () => void {
  if (
    typeof window ===
    "undefined"
  ) {
    return () => {};
  }

  const handleStorage = () =>
    callback();

  window.addEventListener(
    "storage",
    handleStorage,
  );

  window.addEventListener(
    eventName,
    handleStorage,
  );

  return () => {
    window.removeEventListener(
      "storage",
      handleStorage,
    );

    window.removeEventListener(
      eventName,
      handleStorage,
    );
  };
}

// ======================================================
// Formatting Helpers
// ======================================================

function formatNumber(
  value: number,
): string {
  return new Intl.NumberFormat(
    "en-IN",
  ).format(value);
}

function formatStorage(
  storage: number,
): string {
  if (
    storage >= 1024 &&
    storage % 1024 === 0
  ) {
    return `${storage / 1024}TB`;
  }

  return `${storage}GB`;
}

function formatBattery(
  battery: number,
): string {
  return `${formatNumber(
    battery,
  )}mAh`;
}

function formatCamera(
  megapixels: number,
): string {
  return `${megapixels}MP`;
}

function formatDisplaySize(
  size: number,
): string {
  return `${size}"`;
}

function formatClockSpeed(
  value: number,
): string {
  return `${value}GHz`;
}

function formatRating(
  value: number,
): string {
  return `${value.toFixed(1)}★`;
}

function safePercentage(
  value: unknown,
): number | null {
  const numeric =
    Number(value);

  if (
    !Number.isFinite(
      numeric,
    )
  ) {
    return null;
  }

  return Math.max(
    0,
    Math.min(
      100,
      Math.round(numeric),
    ),
  );
}

function safeNumber(
  value: unknown,
): number | null {
  const numeric =
    Number(value);

  if (
    !Number.isFinite(
      numeric,
    )
  ) {
    return null;
  }

  return numeric;
}

// ======================================================
// Component
// ======================================================

export default function ResultCard({
  item,
  index,
  highlight = false,
  selected = false,
  onSelect,
}: Props) {
  const router =
    useRouter();

  // ====================================================
  // Product Identity
  // ====================================================

  const id =
    String(item.id);

  // ====================================================
  // Match Score
  // ====================================================

  const rawScore =
    Number(item.score);

  const safeScore =
    Number.isFinite(
      rawScore,
    )
      ? Math.max(
          0,
          Math.min(
            100,
            Math.round(
              rawScore,
            ),
          ),
        )
      : 0;

  const scoreColor =
    safeScore >= 85
      ? "bg-green-500"
      : safeScore >= 70
        ? "bg-yellow-500"
        : "bg-red-400";

  // ====================================================
  // Price
  // ====================================================

  const rawPrice =
    Number(item.price);

  const hasValidPrice =
    Number.isFinite(
      rawPrice,
    ) &&
    rawPrice > 0;

  const formattedPrice =
    hasValidPrice
      ? new Intl.NumberFormat(
          "en-IN",
        ).format(
          rawPrice,
        )
      : null;

  // ====================================================
  // Saved State
  // ====================================================

  const subscribeSaved =
    useCallback(
      (
        callback: () => void,
      ) =>
        subscribeToEvent(
          SAVED_PRODUCTS_EVENT,
          callback,
        ),
      [],
    );

  const getSavedSnapshot =
    useCallback(
      () =>
        readIdList(
          SAVED_PRODUCTS_KEY,
        ).includes(id),
      [id],
    );

  const saved =
    useSyncExternalStore(
      subscribeSaved,
      getSavedSnapshot,
      () => false,
    );

  // ====================================================
  // Compare State
  // ====================================================

  const subscribeCompared =
    useCallback(
      (
        callback: () => void,
      ) =>
        subscribeToEvent(
          COMPARE_IDS_EVENT,
          callback,
        ),
      [],
    );

  const getComparedSnapshot =
    useCallback(
      () =>
        readIdList(
          COMPARE_IDS_KEY,
        ).includes(id),
      [id],
    );

  const compared =
    useSyncExternalStore(
      subscribeCompared,
      getComparedSnapshot,
      () => false,
    );

  // ====================================================
  // Save / Wishlist
  // ====================================================

  const toggleSave =
    useCallback(() => {
      const stored =
        readIdList(
          SAVED_PRODUCTS_KEY,
        );

      const exists =
        stored.includes(id);

      const updated =
        exists
          ? stored.filter(
              (
                storedId,
              ) =>
                storedId !== id,
            )
          : [
              ...stored,
              id,
            ];

      writeIdList(
        SAVED_PRODUCTS_KEY,
        updated,
      );

      emitLocalStorageEvent(
        SAVED_PRODUCTS_EVENT,
      );

      if (exists) {
        toast.success(
          "Removed from wishlist",
        );
      } else {
        toast.success(
          "Saved to wishlist",
        );
      }
    }, [id]);

  // ====================================================
  // Compare
  // ====================================================

  const toggleCompare =
    useCallback(() => {
      const stored =
        readIdList(
          COMPARE_IDS_KEY,
        );

      const exists =
        stored.includes(id);

      if (exists) {
        const updated =
          stored.filter(
            (
              storedId,
            ) =>
              storedId !== id,
          );

        writeIdList(
          COMPARE_IDS_KEY,
          updated,
        );

        emitLocalStorageEvent(
          COMPARE_IDS_EVENT,
        );

        toast.success(
          "Removed from comparison",
        );

        return;
      }

      if (
        stored.length >=
        MAX_COMPARE_PRODUCTS
      ) {
        toast.error(
          `You can compare up to ${MAX_COMPARE_PRODUCTS} products only`,
        );

        return;
      }

      const updated = [
        ...stored,
        id,
      ];

      writeIdList(
        COMPARE_IDS_KEY,
        updated,
      );

      emitLocalStorageEvent(
        COMPARE_IDS_EVENT,
      );

      toast.success(
        "Added to comparison",
      );
    }, [id]);

  // ====================================================
  // Product Navigation
  // ====================================================

  const openProduct =
    useCallback(() => {
      router.push(
        `/product/${encodeURIComponent(
          id,
        )}`,
      );
    }, [
      id,
      router,
    ]);

  // ====================================================
  // Actual Specifications
  // ====================================================

  const specs =
    item.specs;

  const actualSpecifications =
    [
      specs?.ram != null
        ? {
            key: "ram",
            label: "RAM",
            value: `${formatNumber(
              specs.ram,
            )}GB`,
          }
        : null,

      specs?.storage != null
        ? {
            key: "storage",
            label: "Storage",
            value: formatStorage(
              specs.storage,
            ),
          }
        : null,

      specs?.processor
        ? {
            key: "processor",
            label: "Processor",
            value:
              specs.processor,
          }
        : specs?.chipset
          ? {
              key: "processor",
              label: "Processor",
              value:
                specs.chipset,
            }
          : specs?.processorType
            ? {
                key: "processor",
                label:
                  "Processor",
                value:
                  specs.processorType,
              }
            : null,

      specs?.battery != null
        ? {
            key: "battery",
            label: "Battery",
            value:
              formatBattery(
                specs.battery,
              ),
          }
        : null,

      specs?.cameraMp != null
        ? {
            key: "camera",
            label: "Camera",
            value:
              formatCamera(
                specs.cameraMp,
              ),
          }
        : null,

      item.rating != null &&
      Number.isFinite(
        Number(
          item.rating,
        ),
      )
        ? {
            key: "rating",
            label: "Rating",
            value:
              formatRating(
                Number(
                  item.rating,
                ),
              ),
          }
        : null,

      specs?.displaySize != null
        ? {
            key: "display",
            label: "Display",
            value:
              formatDisplaySize(
                specs.displaySize,
              ),
          }
        : null,

      specs?.refreshRate != null
        ? {
            key: "refresh-rate",
            label:
              "Refresh Rate",
            value: `${Math.round(
              specs.refreshRate,
            )}Hz`,
          }
        : null,

      specs?.frontCameraMp != null
        ? {
            key: "front-camera",
            label:
              "Front Camera",
            value:
              formatCamera(
                specs.frontCameraMp,
              ),
          }
        : null,

      specs?.chargingSpeed != null
        ? {
            key: "charging-speed",
            label:
              "Charging",
            value: `${Math.round(
              specs.chargingSpeed,
            )}W`,
          }
        : null,
    ].filter(
      (
        entry,
      ): entry is {
        key: string;
        label: string;
        value: string;
      } =>
        entry !== null,
    );

  // ====================================================
  // Optional Score Signals
  //
  // These are intentionally separated from actual
  // product specifications.
  // ====================================================

  const breakdown =
    item.breakdown;

  const scoreSignals =
    [
      breakdown?.processor,
      breakdown?.battery,
      breakdown?.rating,
    ]
      .map(
        safePercentage,
      )
      .filter(
        (
          value,
        ): value is number =>
          value !== null,
      );

  const hasScoreSignals =
    scoreSignals.length > 0;

  // ====================================================
  // Render
  // ====================================================

  return (
    <article
      onClick={
        openProduct
      }
      className={[
        "relative rounded-2xl",
        "p-4 md:p-6",
        "bg-white",
        "transition",
        "border",
        "shadow-sm",
        "cursor-pointer",
        "hover:shadow-md",
        highlight
          ? "border-black shadow-xl"
          : "border-gray-200",
      ].join(" ")}
    >
      {/* =================================================
          Compare Checkbox
      ================================================= */}

      {onSelect && (
        <input
          type="checkbox"
          checked={
            selected ||
            compared
          }
          onChange={(
            event,
          ) => {
            event.stopPropagation();

            toggleCompare();
            onSelect();
          }}
          aria-label={`Compare ${
            item.name ||
            "product"
          }`}
          className="
            absolute
            top-3
            left-3
            w-4
            h-4
            cursor-pointer
          "
        />
      )}

      {/* =================================================
          Product Header
      ================================================= */}

      <div className="flex gap-3 md:gap-4 items-start">
        {/* Product Image */}

        <div
          className="
            relative
            w-16
            h-16
            md:w-20
            md:h-20
            shrink-0
            overflow-hidden
            rounded-xl
            border
            bg-white
          "
        >
          <Image
            src={
              item.images?.[0] ||
              "/placeholder.png"
            }
            alt={
              item.name ||
              "Product image"
            }
            fill
            sizes="
              (max-width: 768px) 64px,
              80px
            "
            className="
              object-contain
              p-1
            "
            unoptimized
          />
        </div>

        {/* Product Information */}

        <div className="flex-1 min-w-0">
          <h3
            className="
              font-semibold
              text-black
              text-sm
              leading-tight
              line-clamp-2
              break-words
            "
          >
            {index !==
              undefined &&
              `#${index + 1} `}

            {item.name ||
              "Untitled product"}
          </h3>

          {formattedPrice ? (
            <p
              className="
                text-sm
                text-gray-500
                mt-1
              "
            >
              ₹
              {
                formattedPrice
              }
            </p>
          ) : (
            <p
              className="
                text-sm
                text-gray-400
                mt-1
              "
            >
              Price unavailable
            </p>
          )}
        </div>

        {/* Match Score */}

        <div
          className="
            text-right
            shrink-0
          "
        >
          <div
            className={[
              "text-xs md:text-sm",
              "font-semibold",
              "text-white",
              "px-2 md:px-3",
              "py-1",
              "rounded-full",
              scoreColor,
            ].join(" ")}
          >
            {
              safeScore
            }
          </div>

          <p
            className="
              text-[10px]
              text-gray-400
              mt-1
            "
          >
            match
          </p>
        </div>
      </div>

      {/* =================================================
          Match Progress
      ================================================= */}

      <div
        className="
          w-full
          bg-gray-200
          h-2
          rounded
          mt-4
          overflow-hidden
        "
      >
        <div
          className={[
            scoreColor,
            "h-2",
            "rounded",
          ].join(" ")}
          style={{
            width: `${safeScore}%`,
          }}
        />
      </div>

      <p
        className="
          text-xs
          text-gray-500
          mt-1
        "
      >
        {safeScore >=
        85
          ? "Strong match"
          : safeScore >=
              70
            ? "Good match"
            : "Lower match"}
      </p>

      {/* =================================================
          Explanation
      ================================================= */}

      {item.explanation && (
        <p
          className="
            text-sm
            text-gray-700
            mt-3
            leading-relaxed
            line-clamp-3
          "
        >
          {
            item.explanation
          }
        </p>
      )}

      {/* =================================================
          Product Tags
      ================================================= */}

      {item.tags &&
        item.tags.length >
          0 && (
          <div
            className="
              flex
              gap-2
              mt-3
              flex-wrap
            "
          >
            {item.tags
              .filter(Boolean)
              .slice(
                0,
                6,
              )
              .map(
                (tag) => (
                  <span
                    key={tag}
                    className="
                      text-xs
                      bg-black/5
                      text-gray-700
                      px-2
                      py-1
                      rounded-full
                    "
                  >
                    {tag}
                  </span>
                ),
              )}
          </div>
        )}

      {/* =================================================
          Actual Product Specifications

          IMPORTANT:
          These values come from item.specs and represent
          real product specifications.

          They are NOT ranking percentages.
      ================================================= */}

      {actualSpecifications.length >
        0 && (
        <div
          className="
            mt-4
            rounded-xl
            border
            border-gray-100
            bg-gray-50/70
            p-3
          "
        >
          <div
            className="
              grid
              grid-cols-1
              sm:grid-cols-2
              gap-2
            "
          >
            {actualSpecifications.map(
              ({
                key,
                label,
                value,
              }) => (
                <div
                  key={key}
                  className="
                    flex
                    items-center
                    justify-between
                    gap-3
                    rounded-lg
                    bg-white
                    border
                    border-gray-100
                    px-3
                    py-2
                  "
                >
                  <span
                    className="
                      text-[11px]
                      text-gray-500
                      shrink-0
                    "
                  >
                    {label}
                  </span>

                  <span
                    className="
                      text-[11px]
                      font-medium
                      text-gray-900
                      text-right
                      truncate
                    "
                    title={value}
                  >
                    {value}
                  </span>
                </div>
              ),
            )}
          </div>
        </div>
      )}

      {/* =================================================
          Ranking Signal Summary

          Kept separate from actual product specifications.
          These are internal decision-engine scores only.
      ================================================= */}

      {hasScoreSignals && (
        <div
          className="
            mt-4
            rounded-xl
            border
            border-gray-100
            p-3
          "
        >
          <div
            className="
              text-[10px]
              font-medium
              uppercase
              tracking-wide
              text-gray-400
              mb-2
            "
          >
            Match signals
          </div>

          <div
            className="
              flex
              flex-wrap
              gap-x-4
              gap-y-1
              text-[10px]
              text-gray-500
            "
          >
            {breakdown?.processor !=
              null && (
              <span>
                Processor{" "}
                {safePercentage(
                  breakdown.processor,
                )}
              </span>
            )}

            {breakdown?.battery !=
              null && (
              <span>
                Battery{" "}
                {safePercentage(
                  breakdown.battery,
                )}
              </span>
            )}

            {breakdown?.rating !=
              null && (
              <span>
                Rating{" "}
                {safePercentage(
                  breakdown.rating,
                )}
              </span>
            )}
          </div>
        </div>
      )}

      {/* =================================================
          Footer
      ================================================= */}

      <div
        className="
          mt-5
          flex
          flex-col
          gap-4
        "
      >
        {/* Confidence */}

        {item.confidence !==
          undefined && (
          <span
            className="
              text-xs
              text-gray-500
            "
          >
            Confidence:{" "}
            {Math.max(
              0,
              Math.min(
                100,
                Math.round(
                  Number(
                    item.confidence,
                  ) || 0,
                ),
              ),
            )}
            %
          </span>
        )}

        {/* Actions */}

        <div
          className="
            flex
            flex-wrap
            gap-2
            items-center
            md:justify-end
          "
        >
          {/* Wishlist */}

          <button
            type="button"
            aria-label={
              saved
                ? "Remove from wishlist"
                : "Save to wishlist"
            }
            onClick={(
              event,
            ) => {
              event.stopPropagation();
              toggleSave();
            }}
            className={[
              "p-2",
              "rounded-lg",
              "transition",
              saved
                ? "bg-black text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300",
            ].join(" ")}
          >
            <Heart
              size={16}
              className={
                saved
                  ? "fill-white"
                  : ""
              }
            />
          </button>

          {/* Compare */}

          <button
            type="button"
            onClick={(
              event,
            ) => {
              event.stopPropagation();

              toggleCompare();
              onSelect?.();
            }}
            className={[
              "flex-1",
              "sm:flex-none",
              "min-w-[110px]",
              "px-4",
              "py-2",
              "text-xs",
              "rounded-lg",
              "font-medium",
              "transition",
              compared
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300",
            ].join(" ")}
          >
            {compared
              ? "Added"
              : "Compare"}
          </button>

          {/* Buy Now */}

          <button
            type="button"
            onClick={(
              event,
            ) => {
              event.stopPropagation();

              // Affiliate / marketplace redirect
              // will be connected here later.
            }}
            className="
              flex-1
              sm:flex-none
              min-w-[120px]
              bg-green-600
              text-white
              px-5
              py-2
              rounded-lg
              text-sm
              font-medium
              hover:opacity-90
              active:scale-95
              transition
            "
          >
            Buy Now
          </button>
        </div>
      </div>
    </article>
  );
}