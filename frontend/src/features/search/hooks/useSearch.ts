import { useState } from "react"
import { searchProducts } from "../services/search.service"

export function useSearch() {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const search = async (query: string) => {
    setLoading(true)
    setError(null)

    try {
      const res = await searchProducts(query)
      
      console.log("DATA SET:", res)

      setData(res)
    } catch (err) {
      setError("Something went wrong")
    }

    setLoading(false)
  }

  return { search, loading, data, error }
}