"use client"

import Image from "next/image"
import { useRouter } from "next/navigation"
import {
  BatteryCharging,
  Check,
  ChevronRight,
  Cpu,
  Heart,
  HardDrive,
  Image as ImageIcon,
  MemoryStick,
  Monitor,
  Scale,
  Star,
  Zap,
} from "lucide-react"
import {
  useCallback,
  useSyncExternalStore,
} from "react"
import { toast } from "sonner"

import { ProductItem } from "@/types/search"

type Props = {
  item: ProductItem
  index?: number
  highlight?: boolean
  selected?: boolean
  onSelect?: () => void
}

type Specification = {
  key: string
  label: string
  value: string
}

const SAVED_PRODUCTS_KEY = "saved_products"
const COMPARE_IDS_KEY = "compare_ids"

const SAVED_PRODUCTS_EVENT =
  "shopio:saved-products"

const COMPARE_IDS_EVENT =
  "shopio:compare-ids"

const MAX_COMPARE_PRODUCTS = 4
const DEFAULT_IMAGE = "/placeholder.png"

function readIdList(key: string): string[] {
  if (typeof window === "undefined") {
    return []
  }

  try {
    const raw = window.localStorage.getItem(key)

    if (!raw) {
      return []
    }

    const parsed: unknown = JSON.parse(raw)

    if (!Array.isArray(parsed)) {
      return []
    }

    return Array.from(
      new Set(
        parsed
          .map((value) => String(value))
          .filter(Boolean)
      )
    )
  } catch {
    return []
  }
}

function writeIdList(
  key: string,
  ids: string[]
): void {
  if (typeof window === "undefined") {
    return
  }

  try {
    window.localStorage.setItem(
      key,
      JSON.stringify(Array.from(new Set(ids)))
    )
  } catch {
    // Ignore storage failures.
  }
}

function emitLocalStorageEvent(
  eventName: string
): void {
  if (typeof window === "undefined") {
    return
  }

  window.dispatchEvent(new Event(eventName))
}

function subscribeToEvent(
  eventName: string,
  callback: () => void
): () => void {
  if (typeof window === "undefined") {
    return () => {}
  }

  const handleStorage = () => callback()

  window.addEventListener(
    "storage",
    handleStorage
  )

  window.addEventListener(
    eventName,
    handleStorage
  )

  return () => {
    window.removeEventListener(
      "storage",
      handleStorage
    )

    window.removeEventListener(
      eventName,
      handleStorage
    )
  }
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat(
    "en-IN"
  ).format(value)
}

function formatPrice(
  value: unknown
): string | null {
  const numeric = Number(value)

  if (
    !Number.isFinite(numeric) ||
    numeric <= 0
  ) {
    return null
  }

  return `₹${formatNumber(numeric)}`
}

function formatStorage(
  storage: number
): string {
  if (
    storage >= 1024 &&
    storage % 1024 === 0
  ) {
    return `${storage / 1024}TB`
  }

  return `${storage}GB`
}

function formatBattery(
  battery: number
): string {
  return `${formatNumber(battery)}mAh`
}

function formatCamera(
  megapixels: number
): string {
  return `${megapixels}MP`
}

function formatDisplaySize(
  size: number
): string {
  return `${size}"`
}

function formatRating(
  value: number
): string {
  return `${value.toFixed(1)}★`
}

function safePercentage(
  value: unknown
): number | null {
  const numeric = Number(value)

  if (!Number.isFinite(numeric)) {
    return null
  }

  return Math.max(
    0,
    Math.min(
      100,
      Math.round(numeric)
    )
  )
}

function getScoreTone(score: number) {
  if (score >= 85) {
    return {
      text: "text-emerald-700",
      bg: "bg-emerald-50",
      border: "border-emerald-100",
      bar: "bg-emerald-500",
      label: "Strong match",
    }
  }

  if (score >= 70) {
    return {
      text: "text-amber-700",
      bg: "bg-amber-50",
      border: "border-amber-100",
      bar: "bg-amber-500",
      label: "Good match",
    }
  }

  return {
    text: "text-[#6b7280]",
    bg: "bg-[#f5f6f8]",
    border: "border-[#e5e7eb]",
    bar: "bg-[#8c93a1]",
    label: "Lower match",
  }
}

export default function ResultCard({
  item,
  index,
  highlight = false,
  selected = false,
  onSelect,
}: Props) {
  const router = useRouter()

  const id = String(item.id)

  /* ====================================================
     SCORE
  ==================================================== */

  const rawScore = Number(item.score)

  const safeScore = Number.isFinite(rawScore)
    ? Math.max(
        0,
        Math.min(
          100,
          Math.round(rawScore)
        )
      )
    : 0

  const scoreTone =
    getScoreTone(safeScore)

  /* ====================================================
     PRICE
  ==================================================== */

  const formattedPrice =
    formatPrice(item.price)

  /* ====================================================
     WISHLIST
  ==================================================== */

  const subscribeSaved = useCallback(
    (callback: () => void) =>
      subscribeToEvent(
        SAVED_PRODUCTS_EVENT,
        callback
      ),
    []
  )

  const getSavedSnapshot = useCallback(
    () =>
      readIdList(
        SAVED_PRODUCTS_KEY
      ).includes(id),
    [id]
  )

  const saved = useSyncExternalStore(
    subscribeSaved,
    getSavedSnapshot,
    () => false
  )

  /* ====================================================
     COMPARE
  ==================================================== */

  const subscribeCompared =
    useCallback(
      (callback: () => void) =>
        subscribeToEvent(
          COMPARE_IDS_EVENT,
          callback
        ),
      []
    )

  const getComparedSnapshot =
    useCallback(
      () =>
        readIdList(
          COMPARE_IDS_KEY
        ).includes(id),
      [id]
    )

  const compared =
    useSyncExternalStore(
      subscribeCompared,
      getComparedSnapshot,
      () => false
    )

  /* ====================================================
     SAVE
  ==================================================== */

  const toggleSave = useCallback(() => {
    const stored = readIdList(
      SAVED_PRODUCTS_KEY
    )

    const exists =
      stored.includes(id)

    const updated = exists
      ? stored.filter(
          (storedId) =>
            storedId !== id
        )
      : [...stored, id]

    writeIdList(
      SAVED_PRODUCTS_KEY,
      updated
    )

    emitLocalStorageEvent(
      SAVED_PRODUCTS_EVENT
    )

    toast.success(
      exists
        ? "Removed from wishlist"
        : "Saved to wishlist"
    )
  }, [id])

  /* ====================================================
     COMPARE
  ==================================================== */

  const toggleCompare = useCallback(() => {
    const stored = readIdList(
      COMPARE_IDS_KEY
    )

    const exists =
      stored.includes(id)

    if (exists) {
      writeIdList(
        COMPARE_IDS_KEY,
        stored.filter(
          (storedId) =>
            storedId !== id
        )
      )

      emitLocalStorageEvent(
        COMPARE_IDS_EVENT
      )

      toast.success(
        "Removed from comparison"
      )

      return
    }

    if (
      stored.length >=
      MAX_COMPARE_PRODUCTS
    ) {
      toast.error(
        `You can compare up to ${MAX_COMPARE_PRODUCTS} products only`
      )

      return
    }

    writeIdList(
      COMPARE_IDS_KEY,
      [...stored, id]
    )

    emitLocalStorageEvent(
      COMPARE_IDS_EVENT
    )

    toast.success(
      "Added to comparison"
    )
  }, [id])

  /* ====================================================
     NAVIGATION
  ==================================================== */

  const openProduct = useCallback(() => {
    router.push(
      `/product/${encodeURIComponent(id)}`
    )
  }, [id, router])

  /* ====================================================
     SPECIFICATIONS
  ==================================================== */

  const specs = item.specs

  const actualSpecifications:
    Specification[] = [
    specs?.ram != null
      ? {
          key: "ram",
          label: "RAM",
          value: `${formatNumber(
            specs.ram
          )}GB`,
        }
      : null,

    specs?.storage != null
      ? {
          key: "storage",
          label: "Storage",
          value:
            formatStorage(
              specs.storage
            ),
        }
      : null,

    specs?.processor
      ? {
          key: "processor",
          label: "Processor",
          value: specs.processor,
        }
      : specs?.chipset
        ? {
            key: "processor",
            label: "Processor",
            value: specs.chipset,
          }
        : specs?.processorType
          ? {
              key: "processor",
              label: "Processor",
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
              specs.battery
            ),
        }
      : null,

    specs?.cameraMp != null
      ? {
          key: "camera",
          label: "Camera",
          value:
            formatCamera(
              specs.cameraMp
            ),
        }
      : null,

    item.rating != null &&
    Number.isFinite(
      Number(item.rating)
    )
      ? {
          key: "rating",
          label: "Rating",
          value:
            formatRating(
              Number(item.rating)
            ),
        }
      : null,

    specs?.displaySize != null
      ? {
          key: "display",
          label: "Display",
          value:
            formatDisplaySize(
              specs.displaySize
            ),
        }
      : null,

    specs?.refreshRate != null
      ? {
          key: "refresh-rate",
          label: "Refresh rate",
          value: `${Math.round(
            specs.refreshRate
          )}Hz`,
        }
      : null,

    specs?.chargingSpeed != null
      ? {
          key: "charging-speed",
          label: "Charging",
          value: `${Math.round(
            specs.chargingSpeed
          )}W`,
        }
      : null,
  ].filter(
    (
      entry
    ): entry is Specification =>
      entry !== null
  )

  const breakdown =
    item.breakdown

  /* ====================================================
     CARD
  ==================================================== */

  return (
    <article
      onClick={openProduct}
      className={[
        "group relative w-full",
        highlight
          ? "bg-transparent"
          : "overflow-hidden rounded-[26px] border border-[#e5e7eb] bg-white shadow-[0_8px_30px_rgba(15,23,42,0.04)]",
        "cursor-pointer transition-all duration-300",
        "hover:-translate-y-0.5 hover:shadow-[0_20px_50px_rgba(15,23,42,0.08)]",
        selected || compared
          ? "ring-2 ring-[#5b5ce2]/15"
          : "",
      ].join(" ")}
    >
      {/* ==================================================
          MAIN CONTENT
      ================================================== */}

      <div
        className={
          highlight
            ? "px-0 pb-0"
            : "p-5 sm:p-6"
        }
      >
        {/* Top row */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            {highlight ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#eeeeff] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#5657d8]">
                Best match
              </span>
            ) : index !== undefined ? (
              <span className="rounded-full bg-[#f4f5f7] px-3 py-1.5 text-[11px] font-semibold text-[#7a808a]">
                #{index + 1}
              </span>
            ) : null}

            {compared && (
              <span className="rounded-full bg-[#f3f4ff] px-3 py-1.5 text-[11px] font-medium text-[#5559c9]">
                Comparing
              </span>
            )}
          </div>

          <div
            className={`rounded-full border px-3 py-1.5 ${scoreTone.bg} ${scoreTone.border}`}
          >
            <span
              className={`text-sm font-bold ${scoreTone.text}`}
            >
              {safeScore}
            </span>

            <span
              className={`ml-1 text-[11px] font-medium ${scoreTone.text}`}
            >
              /100
            </span>
          </div>
        </div>

        {/* Main layout */}
        <div className="mt-6 grid items-start gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
          {/* IMAGE */}

          <div
            className="relative self-start"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <div className="relative flex h-[250px] w-full items-center justify-center overflow-hidden rounded-[22px] bg-[#f8f8fb]">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(91,92,226,0.06),transparent_62%)]"
              />

              <div className="relative h-[205px] w-[205px]">
                <Image
                  src={
                    item.images?.[0] ||
                    DEFAULT_IMAGE
                  }
                  alt={
                    item.name ||
                    "Product image"
                  }
                  fill
                  sizes="220px"
                  className="object-contain p-4 transition-transform duration-500 group-hover:scale-[1.04]"
                  unoptimized
                />
              </div>
            </div>
          </div>

          {/* CONTENT */}

          <div className="min-w-0">
            {/* Product name / price */}
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <h2 className="line-clamp-2 text-xl font-semibold leading-7 tracking-[-0.025em] text-[#262626] sm:text-2xl">
                    {item.name ||
                      "Untitled product"}
                  </h2>

                  {formattedPrice && (
                    <p className="mt-2 text-xl font-semibold tracking-tight text-[#262626]">
                      {formattedPrice}
                    </p>
                  )}
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  {item.confidence !==
                    undefined && (
                    <div className="rounded-xl border border-[#e6e8ed] bg-[#fafafc] px-3 py-2 text-right">
                      <p className="text-sm font-semibold text-[#454a53]">
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
                      </p>

                      <p className="text-[10px] uppercase tracking-[0.08em] text-[#9aa0aa]">
                        confidence
                      </p>
                    </div>
                  )}

                  {item.rating !=
                    null && (
                    <div className="inline-flex items-center gap-1 rounded-xl border border-amber-100 bg-amber-50 px-3 py-2">
                      <Star
                        size={14}
                        className="fill-amber-400 text-amber-400"
                        aria-hidden="true"
                      />

                      <span className="text-sm font-semibold text-amber-800">
                        {Number(
                          item.rating
                        ).toFixed(1)}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Match */}
              <div className="pt-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-[#7a808a]">
                    Match quality
                  </span>

                  <span
                    className={`font-semibold ${scoreTone.text}`}
                  >
                    {scoreTone.label}
                  </span>
                </div>

                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#eceef2]">
                  <div
                    className={`h-full rounded-full ${scoreTone.bar}`}
                    style={{
                      width: `${safeScore}%`,
                    }}
                  />
                </div>
              </div>

              {/* Explanation */}
              {item.explanation && (
                <p className="line-clamp-3 text-sm leading-7 text-[#656b76]">
                  {item.explanation}
                </p>
              )}

              {/* Tags */}
              {item.tags &&
                item.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {item.tags
                      .filter(Boolean)
                      .slice(0, 5)
                      .map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full border border-[#e5e7eb] bg-white px-3 py-1.5 text-[11px] font-medium text-[#69707b]"
                        >
                          {tag}
                        </span>
                      ))}
                  </div>
                )}

              {/* Specs */}
              {actualSpecifications.length >
                0 && (
                <div className="mt-1">
                  <div className="grid grid-cols-2 gap-2.5 md:grid-cols-3">
                    {actualSpecifications
                      .slice(0, 6)
                      .map(
                        ({
                          key,
                          label,
                          value,
                        }) => {
                          const Icon =
                            key === "ram"
                              ? MemoryStick
                              : key === "storage"
                                ? HardDrive
                                : key === "processor"
                                  ? Cpu
                                  : key === "battery"
                                    ? BatteryCharging
                                    : key ===
                                        "camera"
                                      ? ImageIcon
                                      : key ===
                                          "display"
                                        ? Monitor
                                        : key ===
                                            "charging-speed"
                                          ? Zap
                                          : Star

                          return (
                            <div
                              key={key}
                              className="rounded-xl border border-[#e7e9ee] bg-[#fafafc] px-3 py-3"
                            >
                              <div className="flex items-center gap-2">
                                <Icon
                                  size={13}
                                  strokeWidth={1.7}
                                  className="shrink-0 text-[#7479d8]"
                                  aria-hidden="true"
                                />

                                <span className="truncate text-[11px] text-[#969ca6]">
                                  {label}
                                </span>
                              </div>

                              <p
                                className="mt-1.5 truncate text-sm font-semibold text-[#34373d]"
                                title={value}
                              >
                                {value}
                              </p>
                            </div>
                          )
                        }
                      )}
                  </div>
                </div>
              )}

              {/* Ranking signals */}
              {breakdown && (
                <div className="flex flex-wrap gap-x-5 gap-y-2 border-t border-[#edf0f3] pt-4 text-[11px] text-[#8a8f98]">
                  {breakdown.processor !=
                    null && (
                    <span>
                      Processor{" "}
                      {safePercentage(
                        breakdown.processor
                      )}
                    </span>
                  )}

                  {breakdown.battery !=
                    null && (
                    <span>
                      Battery{" "}
                      {safePercentage(
                        breakdown.battery
                      )}
                    </span>
                  )}

                  {breakdown.rating !=
                    null && (
                    <span>
                      Rating{" "}
                      {safePercentage(
                        breakdown.rating
                      )}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div
          className="mt-6 flex flex-col gap-3 border-t border-[#e9ebef] pt-5 sm:flex-row sm:items-center sm:justify-between"
          onClick={(event) =>
            event.stopPropagation()
          }
        >
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label={
                saved
                  ? "Remove from wishlist"
                  : "Save to wishlist"
              }
              aria-pressed={saved}
              onClick={toggleSave}
              className={`inline-flex h-10 w-10 items-center justify-center rounded-xl border transition ${
                saved
                  ? "border-[#171717] bg-[#171717] text-white"
                  : "border-[#e2e4ea] bg-white text-[#707681] hover:border-[#cfd2da] hover:text-[#262626]"
              }`}
            >
              <Heart
                size={17}
                className={
                  saved ? "fill-white" : ""
                }
                aria-hidden="true"
              />
            </button>

            <button
              type="button"
              onClick={() => {
                toggleCompare()
                onSelect?.()
              }}
              aria-pressed={compared}
              className={`inline-flex h-10 items-center gap-2 rounded-xl border px-4 text-sm font-medium transition ${
                compared
                  ? "border-[#d6d8f3] bg-[#f1f1ff] text-[#5658cf]"
                  : "border-[#e2e4ea] bg-white text-[#656b76] hover:border-[#cfd2da] hover:text-[#262626]"
              }`}
            >
              {compared ? (
                <Check
                  size={15}
                  aria-hidden="true"
                />
              ) : (
                <Scale
                  size={15}
                  aria-hidden="true"
                />
              )}

              {compared
                ? "Added to compare"
                : "Compare"}
            </button>
          </div>

          <button
            type="button"
            onClick={openProduct}
            className="group inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#171717] px-5 text-sm font-medium text-white transition hover:bg-black hover:shadow-md active:scale-[0.98]"
          >
            View product

            <ChevronRight
              size={16}
              className="transition-transform group-hover:translate-x-0.5"
              aria-hidden="true"
            />
          </button>
        </div>
      </div>
    </article>
  )
}