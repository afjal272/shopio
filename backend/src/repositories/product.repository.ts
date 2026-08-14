import {
  Marketplace,
  Prisma,
  PrismaClient,
} from "@prisma/client";

// ======================================================
// Prisma
// ======================================================

const prisma = new PrismaClient();

// ======================================================
// Repository Types
// ======================================================

export interface UpsertMarketplaceProductInput {
  marketplace: Marketplace;

  externalId: string;

  name: string;

  brand: string;

  category: string;

  description: string;

  price: number;

  originalPrice?: number;

  currency: string;

  productUrl: string;

  imageUrl?: string;

  availability?: string;

  rating?: number;

  reviewsCount?: number;

  images: string[];

  tags: string[];

  highlights: string[];

  weaknesses: string[];

  specs: Prisma.InputJsonValue;

  canonicalKey: string;
}

// ======================================================
// Product Repository
// ======================================================

export class ProductRepository {

  // ====================================================
  // Fetch All Products
  // ====================================================

  /**
   * Fetch all canonical products with all marketplace
   * offers.
   *
   * This method is marketplace-agnostic and should be used
   * only when the caller explicitly needs the complete
   * product catalog.
   */
  async getAllProducts() {
    return prisma.product.findMany({
      include: {
        offers: {
          orderBy: {
            updatedAt: "desc",
          },
        },
      },

      orderBy: {
        updatedAt: "desc",
      },
    });
  }

  // ====================================================
  // Fetch Products By Marketplace
  // ====================================================

  /**
   * Fetch only products that have an offer on the requested
   * marketplace.
   *
   * The marketplace condition is applied at the database
   * level. This prevents unrelated products from reaching
   * the Decision Engine.
   */
  async getProductsByMarketplace(
    marketplace: Marketplace
  ) {
    return prisma.product.findMany({
      where: {
        offers: {
          some: {
            marketplace,
          },
        },
      },

      include: {
        offers: {
          where: {
            marketplace,
          },

          orderBy: {
            updatedAt: "desc",
          },
        },
      },

      orderBy: {
        updatedAt: "desc",
      },
    });
  }

  // ====================================================
  // Fetch Product By ID
  // ====================================================

  /**
   * Fetch a single canonical product with all marketplace
   * offers.
   */
  async getProductById(
    id: string
  ) {
    return prisma.product.findUnique({
      where: {
        id,
      },

      include: {
        offers: {
          orderBy: {
            updatedAt: "desc",
          },
        },
      },
    });
  }

  // ====================================================
  // Upsert Marketplace Product
  // ====================================================

  /**
   * Create or update a marketplace product atomically.
   *
   * Resolution order:
   *
   * 1. Existing marketplace offer by external ID
   * 2. Existing canonical product
   * 3. Completely new product + marketplace offer
   */
  async upsertMarketplaceProduct(
    input: UpsertMarketplaceProductInput
  ) {
    return prisma.$transaction(
      async (transaction) => {

        // ----------------------------------------------
        // Existing Marketplace Offer
        // ----------------------------------------------

        const existingOffer =
          await transaction.productOffer.findUnique({
            where: {
              marketplace_externalId: {
                marketplace:
                  input.marketplace,

                externalId:
                  input.externalId,
              },
            },

            select: {
              productId: true,
            },
          });

        if (existingOffer) {
          return this.updateExistingOffer(
            transaction,
            existingOffer.productId,
            input
          );
        }

        // ----------------------------------------------
        // Existing Canonical Product
        // ----------------------------------------------

        const existingProduct =
          await transaction.product.findUnique({
            where: {
              canonicalKey:
                input.canonicalKey,
            },

            select: {
              id: true,
            },
          });

        if (existingProduct) {
          return this.createOfferForExistingProduct(
            transaction,
            existingProduct.id,
            input
          );
        }

        // ----------------------------------------------
        // Completely New Product
        // ----------------------------------------------

        return this.createProductWithOffer(
          transaction,
          input
        );
      }
    );
  }

  // ====================================================
  // Update Existing Offer
  // ====================================================

  private async updateExistingOffer(
    transaction: Prisma.TransactionClient,
    productId: string,
    input: UpsertMarketplaceProductInput
  ) {
    const product =
      await transaction.product.update({
        where: {
          id: productId,
        },

        data: {
          name:
            input.name,

          brand:
            input.brand,

          category:
            input.category,

          description:
            input.description,

          price:
            input.price,

          discountPrice:
            resolveDiscountPrice(
              input.price,
              input.originalPrice
            ),

          rating:
            input.rating ?? 0,

          reviewsCount:
            input.reviewsCount ?? 0,

          images:
            input.images,

          tags:
            input.tags,

          highlights:
            input.highlights,

          weaknesses:
            input.weaknesses,

          specs:
            input.specs,
        },
      });

    await transaction.productOffer.update({
      where: {
        marketplace_externalId: {
          marketplace:
            input.marketplace,

          externalId:
            input.externalId,
        },
      },

      data: {
        title:
          input.name,

        price:
          input.price,

        originalPrice:
          input.originalPrice,

        currency:
          input.currency,

        productUrl:
          input.productUrl,

        imageUrl:
          input.imageUrl,

        availability:
          input.availability,

        rating:
          input.rating,

        reviewsCount:
          input.reviewsCount,

        lastSyncedAt:
          new Date(),
      },
    });

    return product;
  }

  // ====================================================
  // Create Offer For Existing Product
  // ====================================================

  private async createOfferForExistingProduct(
    transaction: Prisma.TransactionClient,
    productId: string,
    input: UpsertMarketplaceProductInput
  ) {
    await transaction.productOffer.create({
      data: {
        productId,

        marketplace:
          input.marketplace,

        externalId:
          input.externalId,

        title:
          input.name,

        price:
          input.price,

        originalPrice:
          input.originalPrice,

        currency:
          input.currency,

        productUrl:
          input.productUrl,

        imageUrl:
          input.imageUrl,

        availability:
          input.availability,

        rating:
          input.rating,

        reviewsCount:
          input.reviewsCount,

        lastSyncedAt:
          new Date(),
      },
    });

    return transaction.product.update({
      where: {
        id: productId,
      },

      data: {
        price:
          input.price,

        discountPrice:
          resolveDiscountPrice(
            input.price,
            input.originalPrice
          ),

        updatedAt:
          new Date(),
      },
    });
  }

  // ====================================================
  // Create New Product + Offer
  // ====================================================

  private async createProductWithOffer(
    transaction: Prisma.TransactionClient,
    input: UpsertMarketplaceProductInput
  ) {
    return transaction.product.create({
      data: {
        canonicalKey:
          input.canonicalKey,

        name:
          input.name,

        brand:
          input.brand,

        category:
          input.category,

        description:
          input.description,

        price:
          input.price,

        discountPrice:
          resolveDiscountPrice(
            input.price,
            input.originalPrice
          ),

        rating:
          input.rating ?? 0,

        reviewsCount:
          input.reviewsCount ?? 0,

        images:
          input.images,

        tags:
          input.tags,

        highlights:
          input.highlights,

        weaknesses:
          input.weaknesses,

        specs:
          input.specs,

        offers: {
          create: {
            marketplace:
              input.marketplace,

            externalId:
              input.externalId,

            title:
              input.name,

            price:
              input.price,

            originalPrice:
              input.originalPrice,

            currency:
              input.currency,

            productUrl:
              input.productUrl,

            imageUrl:
              input.imageUrl,

            availability:
              input.availability,

            rating:
              input.rating,

            reviewsCount:
              input.reviewsCount,

            lastSyncedAt:
              new Date(),
          },
        },
      },

      include: {
        offers: true,
      },
    });
  }
}

// ======================================================
// Discount Price
// ======================================================

function resolveDiscountPrice(
  price: number,
  originalPrice?: number
): number | null {
  if (
    originalPrice === undefined ||
    originalPrice <= price
  ) {
    return null;
  }

  return price;
}

// ======================================================
// Singleton
// ======================================================

export const productRepository =
  new ProductRepository();