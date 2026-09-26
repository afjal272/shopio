"use client"

import Link from "next/link"
import { useSyncExternalStore } from "react"

import ResultCard from "@/features/search/components/ResultCard"
import { ProductItem } from "@/types/search"

const SAVED_PRODUCTS_KEY = "saved_products"
const LAST_RESULTS_KEY = "last_results"
const STORAGE_EVENT = "BeforeChoice-wishlist-change"

type WishlistSnapshot = {
  savedIds: string[]
  products: ProductItem[]
}

const EMPTY_SNAPSHOT: WishlistSnapshot = {
  savedIds: [],
  products: [],
}

let cachedRawValue = ""
let cachedSnapshot: WishlistSnapshot = EMPTY_SNAPSHOT

function readArray<T>(key: string): T[] {
  if (typeof window === "undefined") {
    return []
  }

  try {
    const raw = window.localStorage.getItem(key)

    if (!raw) {
      return []
    }

    const parsed: unknown = JSON.parse(raw)

    return Array.isArray(parsed) ? (parsed as T[]) : []
  } catch {
    return []
  }
}

function getSnapshot(): WishlistSnapshot {
  if (typeof window === "undefined") {
    return EMPTY_SNAPSHOT
  }

  const savedIdsRaw = window.localStorage.getItem(SAVED_PRODUCTS_KEY) ?? ""
  const lastResultsRaw = window.localStorage.getItem(LAST_RESULTS_KEY) ?? ""

  const rawValue = `${savedIdsRaw}::${lastResultsRaw}`

  if (rawValue === cachedRawValue) {
    return cachedSnapshot
  }

  cachedRawValue = rawValue

  const savedIds = readArray<string>(SAVED_PRODUCTS_KEY)
  const products = readArray<ProductItem>(LAST_RESULTS_KEY)

  cachedSnapshot = {
    savedIds,
    products,
  }

  return cachedSnapshot
}

function getServerSnapshot(): WishlistSnapshot {
  return EMPTY_SNAPSHOT
}

function subscribe(callback: () => void) {
  if (typeof window === "undefined") {
    return () => {}
  }

  const handleStorageChange = () => {
    callback()
  }

  const handleWishlistChange = () => {
    callback()
  }

  window.addEventListener("storage", handleStorageChange)
  window.addEventListener(STORAGE_EVENT, handleWishlistChange)

  return () => {
    window.removeEventListener("storage", handleStorageChange)
    window.removeEventListener(STORAGE_EVENT, handleWishlistChange)
  }
}

function notifyWishlistChange() {
  if (typeof window === "undefined") {
    return
  }

  cachedRawValue = ""
  cachedSnapshot = EMPTY_SNAPSHOT

  window.dispatchEvent(new Event(STORAGE_EVENT))
}

export default function SavedPage() {
  const snapshot = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot
  )

  const { savedIds, products: allProducts } = snapshot

  const products = savedIds
    .slice()
    .reverse()
    .map((id) => allProducts.find((product) => product.id === id))
    .filter((product): product is ProductItem => Boolean(product))

  const handleRemove = (id: string) => {
    const updatedIds = savedIds.filter((itemId) => itemId !== id)

    try {
      window.localStorage.setItem(
        SAVED_PRODUCTS_KEY,
        JSON.stringify(updatedIds)
      )

      notifyWishlistChange()
    } catch {
      // Ignore storage failures without breaking the wishlist UI.
    }
  }

  if (products.length === 0) {
    return (
      <main className="min-h-screen bg-[#fafafc] px-4 py-20">
        <div className="mx-auto max-w-xl text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-[#262626]">
            No saved products
          </h1>

          <p className="mt-2 text-sm leading-6 text-[#656b76]">
            Start saving products to see them here.
          </p>

          <Link
            href="/search"
            className="mt-6 inline-flex items-center rounded-xl bg-[#171717] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-black"
          >
            Explore Products
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#fafafc] px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8a8f98]">
            Your collection
          </p>

          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[#262626]">
            Saved Products
          </h1>

          <p className="mt-2 text-sm text-[#656b76]">
            Products you saved while comparing your options.
          </p>
        </div>

        <div className="space-y-6">
          {products.map((item, index) => (
            <div key={item.id} className="relative">
              <button
                type="button"
                onClick={() => handleRemove(item.id)}
                className="absolute right-3 top-3 z-10 rounded-lg border border-[#e2e4e8] bg-white px-2.5 py-1.5 text-xs font-medium text-[#656b76] shadow-sm transition-colors hover:border-[#d8dade] hover:text-[#262626]"
              >
                Remove
              </button>

              <ResultCard item={item} index={index} />
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}