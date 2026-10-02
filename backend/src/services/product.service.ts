import {
  Marketplace,
} from "@prisma/client";

import {
  mapProduct,
} from "../modules/decision-engine/utils/mapProduct";

import {
  UpsertMarketplaceProductInput,
  productRepository,
} from "../repositories/product.repository";

// ======================================================
// Product Service
// ======================================================

export class ProductService {

  // ====================================================
  // Get All Products
  // ====================================================

  /**
   * Fetch all canonical products with their marketplace
   * offers and map them into the Decision Engine model.
   *
   * This method is intentionally marketplace-agnostic.
   * Use getProductsByMarketplace() when a search must be
   * restricted to a specific marketplace.
   */
  async getAllProducts() {
    const products =
      await productRepository.getAllProducts();

    return products.map(mapProduct);
  }

  // ====================================================
  // Get Products By Marketplace
  // ====================================================

  /**
   * Fetch only products that have an offer for the
   * requested marketplace.
   *
   * Marketplace filtering happens at the repository/database
   * layer so unrelated products never reach the Decision Engine.
   */
  async getProductsByMarketplace(
    marketplace: Marketplace
  ) {
    const products =
      await productRepository.getProductsByMarketplace(
        marketplace
      );

    return products.map(mapProduct);
  }

  // ====================================================
  // Get Product By ID
  // ====================================================

  /**
   * Fetch a single product by its database identifier.
   *
   * The Decision Engine mapper is still used for the canonical
   * product fields. Marketplace offers are then preserved
   * separately so consumers such as the product detail page
   * can access marketplace URLs and external identifiers.
   */
  async getProductById(
    id: string
  ) {
    const normalizedId =
      id.trim();

    if (!normalizedId) {
      return null;
    }

    const product =
      await productRepository.getProductById(
        normalizedId
      );

    if (!product) {
      return null;
    }

    const mappedProduct =
      mapProduct(product);

    return {
      ...mappedProduct,

      offers:
        product.offers.map(
          (offer) => ({
            id:
              offer.id,

            marketplace:
              offer.marketplace,

            externalId:
              offer.externalId,

            title:
              offer.title,

            price:
              offer.price,

            originalPrice:
              offer.originalPrice,

            currency:
              offer.currency,

            productUrl:
              offer.productUrl,

            imageUrl:
              offer.imageUrl,

            availability:
              offer.availability,

            rating:
              offer.rating,

            reviewsCount:
              offer.reviewsCount,
          })
        ),
    };
  }

  // ====================================================
  // Sync Marketplace Product
  // ====================================================

  /**
   * Create or update a product coming from a marketplace.
   *
   * The repository owns the database transaction and
   * marketplace-specific persistence logic.
   */
  async syncMarketplaceProduct(
    input: UpsertMarketplaceProductInput
  ) {
    return productRepository.upsertMarketplaceProduct(
      input
    );
  }

  // ====================================================
  // Sync Multiple Marketplace Products
  // ====================================================

  /**
   * Synchronize a batch of marketplace products.
   *
   * Products are processed sequentially to avoid creating
   * unnecessary database/API pressure during catalog sync.
   */
  async syncMarketplaceProducts(
    products: UpsertMarketplaceProductInput[]
  ) {
    if (products.length === 0) {
      return {
        processed: 0,
        succeeded: 0,
        failed: 0,
      };
    }

    let succeeded = 0;
    let failed = 0;

    for (const product of products) {
      try {
        await this.syncMarketplaceProduct(
          product
        );

        succeeded += 1;
      } catch (error: unknown) {
        failed += 1;

        console.error(
          "Marketplace product sync failed:",
          {
            marketplace:
              product.marketplace,

            externalId:
              product.externalId,

            error,
          }
        );
      }
    }

    return {
      processed:
        products.length,

      succeeded,

      failed,
    };
  }
}

// ======================================================
// Singleton
// ======================================================

export const productService =
  new ProductService();