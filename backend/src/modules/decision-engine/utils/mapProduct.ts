import { Product as PrismaProduct } from "@prisma/client";

import {
  CategoryType,
  Product,
} from "../types";

export function mapProduct(
  product: PrismaProduct
): Product {

  return {

    id: product.id,

    name: product.name,

    brand: product.brand,

    category:
      product.category as CategoryType,

    description:
      product.description,

    price: product.price,

    rating: product.rating,

    reviewsCount:
      product.reviewsCount,

    images: product.images,

    tags: product.tags,

    highlights:
      product.highlights,

    weaknesses:
      product.weaknesses,

    specs:
      product.specs as Product["specs"],

  };

}