import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export class ProductRepository {
  async getAllProducts() {
    return prisma.product.findMany()
  }

  async getProductById(id: string) {
    return prisma.product.findUnique({
      where: { id },
    })
  }
}

export const productRepository = new ProductRepository()