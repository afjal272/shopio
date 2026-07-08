import { mapProduct } from "../modules/decision-engine/utils/mapProduct";
import { productRepository } from "../repositories/product.repository";

export class ProductService {

  async getAllProducts() {

    const products =
      await productRepository.getAllProducts();

    return products.map(mapProduct);

  }

  async getProductById(id: string) {

    const product =
      await productRepository.getProductById(id);

    if (!product) {
      return null;
    }

    return mapProduct(product);

  }

}

export const productService = new ProductService();