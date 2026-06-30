import { productRepository } from "../repositories/product.repository"

export class ProductService {
  async getAllProducts() {
    return productRepository.getAllProducts()
  }

  async getProductById(id: string) {
    return productRepository.getProductById(id)
  }
}

export const productService = new ProductService()