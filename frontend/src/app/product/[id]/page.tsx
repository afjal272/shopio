import type { Product } from "@/types/search"

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  // 🔥 FIX: params ko await karo
  const { id } = await params

  const BASE_URL =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"

  if (!id) {
    return <div className="p-6 text-center">Invalid product ID</div>
  }

  let product: Product | null = null
  let errorMessage: string | null = null

  try {
    const res = await fetch(`${BASE_URL}/api/products/${id}`, {
      cache: "no-store"
    })

    if (!res.ok) {
      errorMessage = "Product not found"
    } else {
      const json = await res.json()
      product = json.data
    }
  } catch (err) {
    console.error("FETCH ERROR:", err)
    errorMessage = "Server error"
  }

  // ✅ JSX always outside try/catch
  if (errorMessage) {
    return <div className="p-6 text-center">{errorMessage}</div>
  }

  if (!product) {
    return <div className="p-6 text-center">No product data</div>
  }

  return (
    <div className="max-w-4xl mx-auto p-6">

      <h1 className="text-2xl font-bold mb-4">
        {product.title}
      </h1>

      <img
        src={product.image || "/placeholder.png"}
        alt={product.title}
        className="w-full max-w-md mb-6 rounded object-cover"
      />

      <p className="text-xl font-semibold mb-4">
        ₹{product.price}
      </p>

      <div className="space-y-2 text-sm mb-6">
        <p>RAM: {product.specs?.ram ?? "N/A"} GB</p>
        <p>Battery: {product.specs?.battery ?? "N/A"} mAh</p>
        <p>Processor Score: {product.specs?.processorScore ?? "N/A"}</p>
        <p>Rating: {product.rating ?? "N/A"}</p>
      </div>

      <div className="mb-6">
        <h2 className="font-semibold mb-2">Why it&apos;s good</h2>
        <ul className="text-sm space-y-1 text-green-600">
          {product.rating && product.rating > 4 && <li>✔ High user rating</li>}
          {product.specs?.battery && product.specs.battery > 4500 && (
            <li>✔ Strong battery</li>
          )}
          {product.specs?.ram && product.specs.ram >= 8 && (
            <li>✔ Good multitasking</li>
          )}
        </ul>
      </div>

      <div>
        <h2 className="font-semibold mb-2">Things to consider</h2>
        <ul className="text-sm space-y-1 text-red-500">
          {product.specs?.ram && product.specs.ram < 6 && (
            <li>⚠ Low RAM</li>
          )}
          {product.rating && product.rating < 4 && (
            <li>⚠ Average rating</li>
          )}
          {product.specs?.battery && product.specs.battery < 4500 && (
            <li>⚠ Battery not the best</li>
          )}
        </ul>
      </div>

    </div>
  )
}