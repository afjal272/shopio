import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  await prisma.product.createMany({
    data: [
      {
        name: "iQOO Neo 7",
        brand: "iQOO",

        price: 21000,
        discountPrice: 19000,

        rating: 4.5,
        reviewsCount: 1800,

        images: [
          "https://via.placeholder.com/300",
          "https://via.placeholder.com/300"
        ],

        description: "Gaming focused smartphone",
        category: "smartphone",

        tags: ["gaming"],
        highlights: ["High performance", "Fast charging"],
        weaknesses: ["Average camera"],
      },
      {
        name: "Samsung M34",
        brand: "Samsung",

        price: 19000,
        discountPrice: 17500,

        rating: 4.4,
        reviewsCount: 2000,

        images: [
          "https://via.placeholder.com/300",
          "https://via.placeholder.com/300"
        ],

        description: "Battery focused smartphone",
        category: "smartphone",

        tags: ["battery"],
        highlights: ["Huge battery", "Good display"],
        weaknesses: ["Slow charging"],
      }
    ]
  })
}

main()
  .then(() => {
    console.log(" Seed done")
  })
  .catch((e) => {
    console.error(e)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })