import type { Product } from "@/types/search"

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
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
      cache: "no-store",
    })

    if (!res.ok) {
      errorMessage = "Product not found"
    } else {
      const json = await res.json()
      product = json.data
    }
  } catch (err) {
    console.error(err)
    errorMessage = "Server error"
  }

  if (errorMessage) {
    return <div className="p-6 text-center">{errorMessage}</div>
  }

  if (!product) {
    return <div className="p-6 text-center">No product data</div>
  }

  // ⭐ derived flags (smart UI)
  const isHighRating = (product.rating ?? 0) >= 4
  const isStrongBattery = (product.specs?.battery ?? 0) >= 4500
  const isGoodRam = (product.specs?.ram ?? 0) >= 8

  return (
    <div className="max-w-6xl mx-auto p-6 grid md:grid-cols-2 gap-10">

      {/* LEFT - IMAGE */}
      <div className="bg-gray-100 rounded-xl p-6 flex items-center justify-center h-[550px]">
        <img
         src={product.image || "/placeholder.png"}
         alt={product.title}
         className="h-full w-full object-contain"
         />
      </div>

      {/* RIGHT - DETAILS */}
      <div>

        {/* TITLE */}
        <h1 className="text-3xl font-bold mb-2">{product.title}</h1>

        {/* PRICE */}
        <p className="text-2xl font-semibold text-green-600 mb-3">
          ₹{product.price}
        </p>

        {/* ⭐ RATING */}
        <div className="flex items-center gap-2 mb-4">
          <div className="flex">
            {Array.from({ length: 5 }).map((_, i) => (
              <span key={i}>
                {i < Math.round(product.rating ?? 0) ? "⭐" : "☆"}
              </span>
            ))}
          </div>
          <span className="text-sm text-gray-600">
            ({product.rating ?? "N/A"})
          </span>
        </div>

        {/* SPECS CARD */}
        <div className="border rounded-xl p-4 mb-6 space-y-2 text-sm">
          <p>⚡ RAM: {product.specs?.ram ?? "N/A"} GB</p>
          <p>🔋 Battery: {product.specs?.battery ?? "N/A"} mAh</p>
          <p>🚀 Performance: {product.specs?.processorScore ?? "N/A"}</p>
          <p>⭐ Rating: {product.rating ?? "N/A"}</p>
        </div>

        {/* WHY GOOD */}
        <div className="mb-6">
          <h2 className="font-semibold mb-2">Why it’s good</h2>
          <ul className="text-sm space-y-1 text-green-600">
            {isHighRating && <li>✔ Trusted by users (high rating)</li>}
            {isStrongBattery && <li>✔ Long battery backup</li>}
            {isGoodRam && <li>✔ Smooth multitasking</li>}
          </ul>
        </div>

        {/* WEAKNESSES (always show something) */}
        <div className="mb-6">
          <h2 className="font-semibold mb-2">Things to consider</h2>
          <ul className="text-sm space-y-1 text-red-500">
            {(product.specs?.ram ?? 0) < 8 && <li>⚠ Not ideal for heavy multitasking</li>}
            {(product.specs?.battery ?? 0) < 4500 && <li>⚠ Battery not the best</li>}
            {(product.rating ?? 0) < 4 && <li>⚠ Average user rating</li>}

            {/* fallback so empty na ho */}
            {(product.specs?.ram ?? 0) >= 8 &&
              (product.specs?.battery ?? 0) >= 4500 &&
              (product.rating ?? 0) >= 4 && (
                <li>⚠ No major weaknesses, but depends on your use case</li>
              )}
          </ul>
        </div>

        {/* WHO SHOULD BUY */}
        <div className="mb-6">
          <h2 className="font-semibold mb-2">Who should buy</h2>
          <ul className="text-sm space-y-1">
            <li>✔ Daily users</li>
            <li>✔ Students</li>
            <li>✔ Budget-conscious buyers</li>
          </ul>
        </div>

        {/* CTA */}
        <button className="w-full bg-black text-white py-3 rounded-xl font-medium hover:opacity-90 transition">
          Buy Now
        </button>

      </div>
    </div>
  )
}