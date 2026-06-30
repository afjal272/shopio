import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  await prisma.product.deleteMany()

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
          "https://via.placeholder.com/300",
        ],

        description: "Gaming focused smartphone",
        category: "smartphone",

        tags: ["gaming"],

        highlights: [
          "High performance",
          "Fast charging",
        ],

        weaknesses: [
          "Average camera",
        ],

        specs: {
          ram: 12,
          battery: 5000,
          processorScore: 9,
        },
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
          "https://via.placeholder.com/300",
        ],

        description: "Battery focused smartphone",
        category: "smartphone",

        tags: ["battery"],

        highlights: [
          "Huge battery",
          "Good display",
        ],

        weaknesses: [
          "Slow charging",
        ],

        specs: {
          ram: 8,
          battery: 6000,
          processorScore: 7,
        },
      },
    ],
  })
}

main()
  .then(() => {
    console.log("✅ Seed completed successfully")
  })
  .catch((error) => {
    console.error("❌ Seed failed:", error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })