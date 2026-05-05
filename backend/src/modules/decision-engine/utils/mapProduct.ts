export function mapProduct(p: any) {
  return {
    id: p.id,
    name: p.name || p.title || "Unknown",
    price: p.price ?? 0,

    images: p.images || (p.image ? [p.image] : []),

    rating: p.rating ?? 0,
    reviewsCount: p.reviewsCount ?? 0,

    specs: p.specs ?? {},

    score: p.score ?? 0,
    confidence: p.confidence ?? 0,

    tags: p.tags ?? [],
  }
}