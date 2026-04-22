import { useState, useCallback } from "react"
import { searchProducts } from "../services/search.service"

export function useSearch() {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const search = useCallback(async (query: string) => {
    setLoading(true)
    setError(null)

    try {
      const res = await searchProducts(query)
      setData(res)
    } catch (err) {
      setError("Something went wrong")
    } finally {
      setLoading(false)
    }
  }, [])

  return { search, loading, data, error }
}