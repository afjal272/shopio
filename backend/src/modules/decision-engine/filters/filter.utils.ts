export function isWithinBudget(
  price: number,
  budget?: number | null,
  flexibility = 1.2
): boolean {
  if (budget == null) {
    return true
  }

  return price <= budget * flexibility
}

export function includesAll(
  source: string[],
  target: string[]
): boolean {
  return target.every((item) => source.includes(item))
}

export function includesAny(
  source: string[],
  target: string[]
): boolean {
  return target.some((item) => source.includes(item))
}

export function isCategoryMatch(
  productCategory: string,
  requestedCategory?: string | null
): boolean {
  if (
    requestedCategory == null ||
    requestedCategory === "general"
  ) {
    return true
  }

  return productCategory === requestedCategory
}

export function isBrandAllowed(
  brand: string,
  preferredBrands?: string[],
  excludedBrands?: string[]
): boolean {
  if (
    preferredBrands?.length &&
    !preferredBrands.includes(brand)
  ) {
    return false
  }

  if (excludedBrands?.includes(brand)) {
    return false
  }

  return true
}