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

const SAVED_PRODUCTS_KEY = "saved_products";
const COMPARE_IDS_KEY = "compare_ids";

const SAVED_PRODUCTS_EVENT = "shopio:saved-products";
const COMPARE_IDS_EVENT = "shopio:compare-ids";

const MAX_COMPARE_PRODUCTS = 4;

const BREAKDOWN_KEYS = [
  "ram",
  "processor",
  "battery",
  "rating",
] as const;

// ======================================================
// Local Storage Helpers
// ======================================================

function readIdList(key: string): string[] {
  if (typeof window === "undefined") {
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

    if (!Array.isArray(parsed)) {
      return [];
    }

    return Array.from(
      new Set(
        parsed
          .map((value) => String(value))
          .filter(Boolean)
      )
    );
  } catch {
    return [];
  }
}

function writeIdList(
  key: string,
  ids: string[]
): void {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.setItem(
    key,
    JSON.stringify(
      Array.from(
        new Set(ids)
      )
    )
  );
}

function emitLocalStorageEvent(
  eventName: string
): void {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(
    new Event(eventName)
  );
}

// ======================================================
// External Store
// ======================================================

function subscribeToEvent(
  eventName: string,
  callback: () => void
): () => void {
  if (typeof window === "undefined") {
    return () => {};
  }

  const handleStorage =
    () => callback();

  window.addEventListener(
    "storage",
    handleStorage
  );

  window.addEventListener(
    eventName,
    handleStorage
  );

  return () => {
    window.removeEventListener(
      "storage",
      handleStorage
    );

    window.removeEventListener(
      eventName,
      handleStorage
    );
  };
}

// ======================================================
// Component
// ======================================================

export default function ResultCard({
  item,
  highlight = false,
  index,
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
  // Score
  // ====================================================

  const rawScore =
    Number(item.score);

  const safeScore =
    Number.isFinite(rawScore)
      ? Math.max(
          0,
          Math.min(
            100,
            Math.round(rawScore)
          )
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
    Number.isFinite(rawPrice) &&
    rawPrice > 0;

  const formattedPrice =
    hasValidPrice
      ? new Intl.NumberFormat(
          "en-IN"
        ).format(rawPrice)
      : null;

  // ====================================================
  // Saved State
  // ====================================================

  const subscribeSaved =
    useCallback(
      (callback: () => void) =>
        subscribeToEvent(
          SAVED_PRODUCTS_EVENT,
          callback
        ),
      []
    );

  const getSavedSnapshot =
    useCallback(
      () =>
        readIdList(
          SAVED_PRODUCTS_KEY
        ).includes(id),
      [id]
    );

  const saved =
    useSyncExternalStore(
      subscribeSaved,
      getSavedSnapshot,
      () => false
    );

  // ====================================================
  // Compare State
  // ====================================================

  const subscribeCompared =
    useCallback(
      (callback: () => void) =>
        subscribeToEvent(
          COMPARE_IDS_EVENT,
          callback
        ),
      []
    );

  const getComparedSnapshot =
    useCallback(
      () =>
        readIdList(
          COMPARE_IDS_KEY
        ).includes(id),
      [id]
    );

  const compared =
    useSyncExternalStore(
      subscribeCompared,
      getComparedSnapshot,
      () => false
    );

  // ====================================================
  // Save / Wishlist
  // ====================================================

  const toggleSave =
    useCallback(() => {
      const stored =
        readIdList(
          SAVED_PRODUCTS_KEY
        );

      const exists =
        stored.includes(id);

      const updated =
        exists
          ? stored.filter(
              (storedId) =>
                storedId !== id
            )
          : [
              ...stored,
              id,
            ];

      writeIdList(
        SAVED_PRODUCTS_KEY,
        updated
      );

      emitLocalStorageEvent(
        SAVED_PRODUCTS_EVENT
      );

      if (exists) {
        toast.success(
          "Removed from wishlist"
        );
      } else {
        toast.success(
          "Saved to wishlist"
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
          COMPARE_IDS_KEY
        );

      const exists =
        stored.includes(id);

      if (exists) {
        const updated =
          stored.filter(
            (storedId) =>
              storedId !== id
          );

        writeIdList(
          COMPARE_IDS_KEY,
          updated
        );

        emitLocalStorageEvent(
          COMPARE_IDS_EVENT
        );

        toast.success(
          "Removed from comparison"
        );

        return;
      }

      if (
        stored.length >=
        MAX_COMPARE_PRODUCTS
      ) {
        toast.error(
          `You can compare up to ${MAX_COMPARE_PRODUCTS} products only`
        );

        return;
      }

      const updated =
        [
          ...stored,
          id,
        ];

      writeIdList(
        COMPARE_IDS_KEY,
        updated
      );

      emitLocalStorageEvent(
        COMPARE_IDS_EVENT
      );

      toast.success(
        "Added to comparison"
      );
    }, [id]);

  // ====================================================
  // Product Navigation
  // ====================================================

  const openProduct =
    useCallback(() => {
      router.push(
        `/product/${encodeURIComponent(id)}`
      );
    }, [id, router]);

  // ====================================================
  // Breakdown
  // ====================================================

  const breakdownEntries =
    BREAKDOWN_KEYS
      .map((key) => {
        const value =
          Number(
            item.breakdown?.[
              key
            ]
          );

        if (
          !Number.isFinite(value)
        ) {
          return null;
        }

        return {
          key,
          value: Math.max(
            0,
            Math.min(
              100,
              Math.round(value)
            )
          ),
        };
      })
      .filter(
        (
          entry
        ): entry is {
          key: (
            typeof BREAKDOWN_KEYS
          )[number];
          value: number;
        } =>
          entry !== null
      );

  // ====================================================
  // Render
  // ====================================================

  return (
    <article
      onClick={openProduct}
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
            selected || compared
          }
          onChange={(event) => {
            event.stopPropagation();

            toggleCompare();
            onSelect();
          }}
          aria-label={`Compare ${item.name || "product"}`}
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

        <div className="
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
        ">
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
          <h3 className="
            font-semibold
            text-black
            text-sm
            leading-tight
            line-clamp-2
            break-words
          ">
            {index !== undefined &&
              `#${index + 1} `}

            {item.name ||
              "Untitled product"}
          </h3>

          {formattedPrice ? (
            <p className="
              text-sm
              text-gray-500
              mt-1
            ">
              ₹{formattedPrice}
            </p>
          ) : (
            <p className="
              text-sm
              text-gray-400
              mt-1
            ">
              Price unavailable
            </p>
          )}
        </div>

        {/* Match Score */}

        <div className="
          text-right
          shrink-0
        ">
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
            {safeScore}
          </div>

          <p className="
            text-[10px]
            text-gray-400
            mt-1
          ">
            match
          </p>
        </div>
      </div>

      {/* =================================================
          Match Progress
      ================================================= */}

      <div className="
        w-full
        bg-gray-200
        h-2
        rounded
        mt-4
        overflow-hidden
      ">
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

      <p className="
        text-xs
        text-gray-500
        mt-1
      ">
        {safeScore >= 85
          ? "Strong match"
          : safeScore >= 70
          ? "Good match"
          : "Lower match"}
      </p>

      {/* =================================================
          Explanation
      ================================================= */}

      {item.explanation && (
        <p className="
          text-sm
          text-gray-700
          mt-3
          leading-relaxed
          line-clamp-3
        ">
          {item.explanation}
        </p>
      )}

      {/* =================================================
          Product Tags
      ================================================= */}

      {item.tags &&
        item.tags.length > 0 && (
          <div className="
            flex
            gap-2
            mt-3
            flex-wrap
          ">
            {item.tags
              .filter(Boolean)
              .slice(0, 6)
              .map((tag) => (
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
              ))}
          </div>
        )}

      {/* =================================================
          Core Score Breakdown
          Only real core scoring dimensions are shown.
      ================================================= */}

      {breakdownEntries.length > 0 && (
        <div className="
          mt-4
          space-y-2
        ">
          {breakdownEntries.map(
            ({
              key,
              value,
            }) => (
              <div
                key={key}
              >
                <div className="
                  flex
                  justify-between
                  text-[11px]
                  text-gray-500
                  mb-1
                ">
                  <span className="
                    capitalize
                  ">
                    {key}
                  </span>

                  <span>
                    {value}%
                  </span>
                </div>

                <div className="
                  w-full
                  bg-gray-200
                  h-1
                  rounded
                  overflow-hidden
                ">
                  <div
                    className="
                      bg-black/70
                      h-1
                      rounded
                    "
                    style={{
                      width: `${value}%`,
                    }}
                  />
                </div>
              </div>
            )
          )}
        </div>
      )}

      {/* =================================================
          Footer
      ================================================= */}

      <div className="
        mt-5
        flex
        flex-col
        gap-4
      ">
        {/* Confidence */}

        {item.confidence !==
          undefined && (
          <span className="
            text-xs
            text-gray-500
          ">
            Confidence:{" "}
            {Math.max(
              0,
              Math.min(
                100,
                Math.round(
                  Number(
                    item.confidence
                  ) || 0
                )
              )
            )}
            %
          </span>
        )}

        {/* Actions */}

        <div className="
          flex
          flex-wrap
          gap-2
          items-center
          md:justify-end
        ">
          {/* Wishlist */}

          <button
            type="button"
            aria-label={
              saved
                ? "Remove from wishlist"
                : "Save to wishlist"
            }
            onClick={(event) => {
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
            onClick={(event) => {
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
            onClick={(event) => {
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