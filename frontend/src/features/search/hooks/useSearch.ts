import { useState, useCallback } from "react"
import { searchProducts } from "../services/search.service"
import { SearchResponse } from "@/types/search"

export function useSearch() {
  const [loading, setLoading] = useState<boolean>(false)
  const [data, setData] = useState<SearchResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  const search = useCallback(
    async (query: string, intent: string[] = ["balanced"]) => {
      setLoading(true)
      setError(null)

      try {
        const res = await searchProducts(query, intent)

        console.log("API RES:", res) // debug
        setData(res)
      } catch (err: unknown) {
        console.error("SEARCH ERROR:", err)

        if (err instanceof Error) {
          setError(err.message)
        } else {
          setError("Something went wrong")
        }
      } finally {
        setLoading(false)
      }
    },
    []
  )

  return { search, loading, data, error }
}