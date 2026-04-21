import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  await prisma.product.createMany({
    data: [
      {
        title: "iQOO Neo 7",
        price: 21000,
        rating: 4.5,
        reviewsCount: 1800,
        tags: ["gaming"],
        image: "https://via.placeholder.com/150",
        specs: {
          ram: 12,
          processorScore: 9,
          battery: 5000
        }
      },
      {
        title: "Samsung M34",
        price: 19000,
        rating: 4.4,
        reviewsCount: 2000,
        tags: ["battery"],
        image: "https://via.placeholder.com/150",
        specs: {
          ram: 8,
          processorScore: 7,
          battery: 6000
        }
      }
    ]
  })
}

main()
  .then(() => {
    console.log("🌱 Seed done")
  })
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })