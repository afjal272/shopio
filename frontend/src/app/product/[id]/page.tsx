import type { Metadata } from "next"

import type { Product } from "@/types/search"



const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"



const SITE_URL = "https://beforechoice.in"



const AMAZON_AFFILIATE_TAG =
  process.env.AMAZON_AFFILIATE_TAG?.trim() || ""



type ProductPageProps = {
  params: Promise<{ id: string }>
}



async function getProduct(id: string): Promise<Product | null> {
  try {
    const res = await fetch(`${BASE_URL}/api/products/${id}`, {
      cache: "no-store",
    })



    if (!res.ok) {
      return null
    }



    const json = await res.json()



    return json.data ?? null
  } catch (error) {
    console.error("Failed to fetch product:", error)
    return null
  }
}



/* =========================================================
   Amazon Affiliate URL
========================================================= */



function buildAmazonAffiliateUrl(
  product: Product
): string | null {
  const amazonOffer = product.offers?.find(
    (offer) =>
      offer.marketplace?.toUpperCase() === "AMAZON" &&
      Boolean(offer.productUrl) &&
      Boolean(offer.externalId)
  )



  if (!amazonOffer) {
    return null
  }



  const originalUrl =
    amazonOffer.productUrl?.trim()



  if (!originalUrl) {
    return null
  }



  try {
    const url = new URL(originalUrl)



    /*
     * The original Amazon product URL is already provided by
     * the Amazon integration. We only attach the Associates
     * tracking tag here.
     *
     * Example:
     * https://www.amazon.in/dp/B0XXXXXXXX?tag=beforechoice2-21
     */
    if (AMAZON_AFFILIATE_TAG) {
      url.searchParams.set(
        "tag",
        AMAZON_AFFILIATE_TAG
      )
    }



    return url.toString()
  } catch {
    /*
     * Keep the product usable even if an unexpected malformed
     * URL comes from the upstream marketplace response.
     */
    return originalUrl
  }
}



/* =========================================================
   Dynamic SEO Metadata
========================================================= */



export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { id } = await params



  if (!id) {
    return {
      title: "Product Not Found | BeforeChoice",
      description: "The requested product could not be found.",
      robots: {
        index: false,
        follow: false,
      },
    }
  }



  const product = await getProduct(id)



  if (!product) {
    return {
      title: "Product Not Found | BeforeChoice",
      description: "The requested product could not be found.",
      robots: {
        index: false,
        follow: false,
      },
    }
  }



  const productName = product.name || "Product"



  const price = product.price
    ? `₹${Number(product.price).toLocaleString("en-IN")}`
    : ""



  const title =
    `${productName} | Price, Specs & Comparison | BeforeChoice`



  const description =
    `${productName}${price ? ` at ${price}` : ""}. ` +
    `Compare specifications, performance, battery, rating and key features on BeforeChoice before you buy.`



  const canonicalUrl =
    `${SITE_URL}/product/${encodeURIComponent(id)}`



  const productImage =
    product.images?.[0] ||
    `${SITE_URL}/placeholder.png`



  return {
    title,



    description,



    keywords: [
      productName,
      `${productName} price`,
      `${productName} specifications`,
      `${productName} specs`,
      `${productName} review`,
      `${productName} comparison`,
      `${productName} features`,
      `${productName} battery`,
      `${productName} performance`,
      `buy ${productName}`,
      `compare ${productName}`,
      "product comparison",
      "best product",
      "BeforeChoice",
      "Before Choice",
    ],



    alternates: {
      canonical: canonicalUrl,
    },



    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },



    openGraph: {
      type: "website",
      url: canonicalUrl,
      siteName: "BeforeChoice",
      title,
      description,
      locale: "en_IN",
      images: [
        {
          url: productImage,
          alt: productName,
        },
      ],
    },



    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [productImage],
    },
  }
}



/* =========================================================
   Product Page
========================================================= */



export default async function ProductPage({
  params,
}: ProductPageProps) {
  const { id } = await params



  if (!id) {
    return (
      <div className="p-6 text-center">
        Invalid product ID
      </div>
    )
  }



  const product = await getProduct(id)



  if (!product) {
    return (
      <div className="p-6 text-center">
        Product not found
      </div>
    )
  }



  // ========================================================
  // Derived values
  // ========================================================



  const ram = product.specs?.ram ?? 0
  const battery = product.specs?.battery ?? 0
  const rating = product.rating ?? 0



  const isHighRating = rating >= 4
  const isStrongBattery = battery >= 4500
  const isGoodRam = ram >= 8



  const productName = product.name || "Product"



  const productImage =
    product.images?.[0] ||
    `${SITE_URL}/placeholder.png`



  const productUrl =
    `${SITE_URL}/product/${encodeURIComponent(id)}`



  const amazonAffiliateUrl =
    buildAmazonAffiliateUrl(product)



  // ========================================================
  // Product Structured Data
  // ========================================================



  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Product",



    "@id": `${productUrl}#product`,



    name: productName,



    url: productUrl,



    description:
      `${productName}. Compare price, specifications, ` +
      `performance, battery and features on BeforeChoice.`,



    image: [productImage],



    offers: product.price
      ? {
          "@type": "Offer",
          url: productUrl,
          priceCurrency: "INR",
          price: Number(product.price),
          availability:
            "https://schema.org/InStock",
        }
      : undefined,
  }



  return (
    <div className="mx-auto grid max-w-6xl gap-10 p-6 md:grid-cols-2">
      {/* ==================================================
          Product Structured Data
      ================================================== */}



      <script
        id="beforechoice-product-structured-data"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html:
            JSON.stringify(structuredData),
        }}
      />



      {/* ==================================================
          IMAGE
      ================================================== */}



      <div className="flex h-[550px] items-center justify-center rounded-xl bg-gray-100 p-6">
        <img
          src={productImage}
          alt={`${productName} product image`}
          className="h-full w-full object-contain"
        />
      </div>



      {/* ==================================================
          DETAILS
      ================================================== */}



      <div>
        {/* TITLE */}



        <h1 className="mb-2 text-3xl font-bold">
          {productName}
        </h1>



        {/* PRICE */}



        <p className="mb-3 text-2xl font-semibold text-green-600">
          ₹
          {Number(
            product.price || 0
          ).toLocaleString("en-IN")}
        </p>



        {/* RATING */}



        <div className="mb-4 flex items-center gap-2">
          <div className="flex">
            {Array.from({
              length: 5,
            }).map((_, i) => (
              <span key={i}>
                {i <
                Math.round(rating)
                  ? "⭐"
                  : "☆"}
              </span>
            ))}
          </div>



          <span className="text-sm text-gray-600">
            ({rating || "N/A"})
          </span>
        </div>



        {/* SPECS */}



        <div className="mb-6 space-y-2 rounded-xl border p-4 text-sm">
          <p>
            ⚡ RAM:{" "}
            {ram || "N/A"} GB
          </p>



          <p>
            🔋 Battery:{" "}
            {battery || "N/A"} mAh
          </p>



          <p>
            🚀 Performance:{" "}
            {product.specs
              ?.processorScore ??
              "N/A"}
          </p>



          <p>
            ⭐ Rating:{" "}
            {rating || "N/A"}
          </p>
        </div>



        {/* WHY GOOD */}



        <div className="mb-6">
          <h2 className="mb-2 font-semibold">
            Why it’s good
          </h2>



          <ul className="space-y-1 text-sm text-green-600">
            {isHighRating && (
              <li>
                ✔ Trusted by users
                (high rating)
              </li>
            )}



            {isStrongBattery && (
              <li>
                ✔ Long battery backup
              </li>
            )}



            {isGoodRam && (
              <li>
                ✔ Smooth multitasking
              </li>
            )}
          </ul>
        </div>



        {/* WEAKNESSES */}



        <div className="mb-6">
          <h2 className="mb-2 font-semibold">
            Things to consider
          </h2>



          <ul className="space-y-1 text-sm text-red-500">
            {ram < 8 && (
              <li>
                ⚠ Not ideal for heavy multitasking
              </li>
            )}



            {battery < 4500 && (
              <li>
                ⚠ Battery may not be ideal for heavy use
              </li>
            )}



            {rating < 4 && (
              <li>
                ⚠ Average user rating
              </li>
            )}



            {!(
              ram < 8 ||
              battery < 4500 ||
              rating < 4
            ) && (
              <li>
                ⚠ No major weaknesses, but suitability depends on your use case
              </li>
            )}
          </ul>
        </div>



        {/* WHO SHOULD BUY */}



        <div className="mb-6">
          <h2 className="mb-2 font-semibold">
            Who should buy
          </h2>



          <ul className="space-y-1 text-sm">
            <li>
              ✔ Daily users
            </li>

            <li>
              ✔ Students
            </li>

            <li>
              ✔ Budget-conscious buyers
            </li>
          </ul>
        </div>



        {/* CTA */}



        {amazonAffiliateUrl ? (
          <a
            href={amazonAffiliateUrl}
            target="_blank"
            rel="nofollow sponsored noopener"
            className="block w-full rounded-xl bg-black py-3 text-center font-medium text-white transition hover:opacity-90"
          >
            Buy Now
          </a>
        ) : (
          <button
            type="button"
            disabled
            className="w-full cursor-not-allowed rounded-xl bg-gray-400 py-3 font-medium text-white"
            title="Amazon offer is currently unavailable"
          >
            Buy Now
          </button>
        )}



        {/* AMAZON DISCLOSURE */}



        <p className="mt-2 text-center text-xs text-gray-500">
          As an Amazon Associate I earn from qualifying purchases.
        </p>
      </div>
    </div>
  )
}