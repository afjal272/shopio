import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  await prisma.product.deleteMany()

  await prisma.product.createMany({

    
    data: [

  {
    name: "iQOO Neo 7",
    brand: "iQOO",

    price: 21999,
    discountPrice: 19999,

    rating: 4.5,
    reviewsCount: 18500,

    images: [
      "https://via.placeholder.com/300",
      "https://via.placeholder.com/300",
    ],

    description: "High-performance gaming smartphone",

    category: "smartphone",

    tags: ["gaming"],

    highlights: [
      "Dimensity 8200 Processor",
      "120W Fast Charging",
      "120Hz AMOLED Display",
    ],

    weaknesses: [
      "Average ultrawide camera",
    ],

    specs: {
      ram: 12,
      battery: 5000,
      processorScore: 9,
    },
  },

  {
    name: "Samsung Galaxy M34",
    brand: "Samsung",

    price: 18999,
    discountPrice: 17499,

    rating: 4.4,
    reviewsCount: 22200,

    images: [
      "https://via.placeholder.com/300",
      "https://via.placeholder.com/300",
    ],

    description: "Battery focused smartphone",

    category: "smartphone",

    tags: ["battery"],

    highlights: [
      "6000mAh Battery",
      "Super AMOLED Display",
      "Good Cameras",
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

  {
    name: "Poco X6",
    brand: "Poco",

    price: 20999,
    discountPrice: 19499,

    rating: 4.4,
    reviewsCount: 14600,

    images: [
      "https://via.placeholder.com/300",
      "https://via.placeholder.com/300",
    ],

    description: "Balanced performance smartphone",

    category: "smartphone",

    tags: ["gaming"],

    highlights: [
      "Snapdragon 7s Gen 2",
      "120Hz AMOLED",
      "67W Fast Charging",
    ],

    weaknesses: [
      "Average software experience",
    ],

    specs: {
      ram: 8,
      battery: 5100,
      processorScore: 8,
    },
  },

  {
    name: "Redmi Note 13 Pro",
    brand: "Redmi",

    price: 24999,
    discountPrice: 22999,

    rating: 4.5,
    reviewsCount: 13800,

    images: [
      "https://via.placeholder.com/300",
      "https://via.placeholder.com/300",
    ],

    description: "Camera-centric smartphone",

    category: "smartphone",

    tags: ["camera"],

    highlights: [
      "200MP Camera",
      "AMOLED Display",
      "67W Charging",
    ],

    weaknesses: [
      "Heavy weight",
    ],

    specs: {
      ram: 8,
      battery: 5100,
      processorScore: 8,
    },
  },

  {
    name: "Realme Narzo 70 Pro",
    brand: "Realme",

    price: 18999,
    discountPrice: 17999,

    rating: 4.3,
    reviewsCount: 9200,

    images: [
      "https://via.placeholder.com/300",
      "https://via.placeholder.com/300",
    ],

    description: "Camera and performance balanced smartphone",

    category: "smartphone",

    tags: ["camera"],

    highlights: [
      "Sony IMX890 Sensor",
      "Fast Charging",
      "Premium Design",
    ],

    weaknesses: [
      "Mono speaker",
    ],

    specs: {
      ram: 8,
      battery: 5000,
      processorScore: 8,
    },
  },

  {
    name: "Motorola Edge 50 Fusion",
    brand: "Motorola",

    price: 22999,
    discountPrice: 20999,

    rating: 4.5,
    reviewsCount: 8100,

    images: [
      "https://via.placeholder.com/300",
      "https://via.placeholder.com/300",
    ],

    description: "Premium clean Android smartphone",

    category: "smartphone",

    tags: ["balanced"],

    highlights: [
      "Clean Android",
      "144Hz Display",
      "IP68 Rating",
    ],

    weaknesses: [
      "Average gaming",
    ],

    specs: {
      ram: 8,
      battery: 5000,
      processorScore: 8,
    },
  },

  {
    name: "Nothing Phone (2a)",
    brand: "Nothing",

    price: 23999,
    discountPrice: 21999,

    rating: 4.6,
    reviewsCount: 9900,

    images: [
      "https://via.placeholder.com/300",
      "https://via.placeholder.com/300",
    ],

    description: "Unique design with clean software",

    category: "smartphone",

    tags: ["balanced"],

    highlights: [
      "Glyph Interface",
      "Clean OS",
      "Excellent Display",
    ],

    weaknesses: [
      "Slow updates compared to flagship",
    ],

    specs: {
      ram: 8,
      battery: 5000,
      processorScore: 8,
    },
  },

  {
    name: "OnePlus Nord CE 4",
    brand: "OnePlus",

    price: 24999,
    discountPrice: 22999,

    rating: 4.5,
    reviewsCount: 12100,

    images: [
      "https://via.placeholder.com/300",
      "https://via.placeholder.com/300",
    ],

    description: "Fast charging performance smartphone",

    category: "smartphone",

    tags: ["gaming"],

    highlights: [
      "100W SUPERVOOC",
      "Snapdragon 7 Gen 3",
      "Excellent Battery",
    ],

    weaknesses: [
      "Average camera in low light",
    ],

    specs: {
      ram: 8,
      battery: 5500,
      processorScore: 9,
    },
  },
      {
        name: "Samsung Galaxy A35",
        brand: "Samsung",

        price: 27999,
        discountPrice: 25999,

        rating: 4.5,
        reviewsCount: 15800,

        images: [
          "https://via.placeholder.com/300",
          "https://via.placeholder.com/300",
        ],

        description: "Premium Samsung smartphone",

        category: "smartphone",

        tags: ["camera"],

        highlights: [
          "120Hz AMOLED",
          "IP67 Rating",
          "Excellent Cameras",
        ],

        weaknesses: [
          "Charging could be faster",
        ],

        specs: {
          ram: 8,
          battery: 5000,
          processorScore: 8,
        },
      },

      {
        name: "iQOO Z9",
        brand: "iQOO",

        price: 19999,
        discountPrice: 18499,

        rating: 4.4,
        reviewsCount: 9700,

        images: [
          "https://via.placeholder.com/300",
          "https://via.placeholder.com/300",
        ],

        description: "Powerful gaming smartphone",

        category: "smartphone",

        tags: ["gaming"],

        highlights: [
          "Dimensity 7200",
          "120Hz AMOLED",
          "Excellent Performance",
        ],

        weaknesses: [
          "Average speakers",
        ],

        specs: {
          ram: 8,
          battery: 5000,
          processorScore: 8,
        },
      },

      {
        name: "Poco X6 Pro",
        brand: "Poco",

        price: 28999,
        discountPrice: 26999,

        rating: 4.6,
        reviewsCount: 18200,

        images: [
          "https://via.placeholder.com/300",
          "https://via.placeholder.com/300",
        ],

        description: "Flagship killer performance phone",

        category: "smartphone",

        tags: ["gaming"],

        highlights: [
          "Dimensity 8300 Ultra",
          "120W Charging",
          "Excellent Gaming",
        ],

        weaknesses: [
          "Camera is average",
        ],

        specs: {
          ram: 12,
          battery: 5000,
          processorScore: 10,
        },
      },

      {
        name: "Redmi Note 13",
        brand: "Redmi",

        price: 17999,
        discountPrice: 16499,

        rating: 4.3,
        reviewsCount: 11100,

        images: [
          "https://via.placeholder.com/300",
          "https://via.placeholder.com/300",
        ],

        description: "Balanced everyday smartphone",

        category: "smartphone",

        tags: ["balanced"],

        highlights: [
          "AMOLED Display",
          "Fast Charging",
          "Slim Design",
        ],

        weaknesses: [
          "Average gaming",
        ],

        specs: {
          ram: 8,
          battery: 5000,
          processorScore: 7,
        },
      },

      {
        name: "Vivo T3",
        brand: "Vivo",

        price: 20999,
        discountPrice: 19499,

        rating: 4.4,
        reviewsCount: 7600,

        images: [
          "https://via.placeholder.com/300",
          "https://via.placeholder.com/300",
        ],

        description: "Performance and camera smartphone",

        category: "smartphone",

        tags: ["camera"],

        highlights: [
          "AMOLED Display",
          "Sony Camera Sensor",
          "Good Performance",
        ],

        weaknesses: [
          "UI contains bloatware",
        ],

        specs: {
          ram: 8,
          battery: 5000,
          processorScore: 8,
        },
      },

      {
        name: "Oppo F27 Pro",
        brand: "Oppo",

        price: 24999,
        discountPrice: 22999,

        rating: 4.3,
        reviewsCount: 6800,

        images: [
          "https://via.placeholder.com/300",
          "https://via.placeholder.com/300",
        ],

        description: "Stylish premium smartphone",

        category: "smartphone",

        tags: ["balanced"],

        highlights: [
          "Premium Design",
          "IP69 Rating",
          "Curved Display",
        ],

        weaknesses: [
          "Processor could be stronger",
        ],

        specs: {
          ram: 8,
          battery: 5000,
          processorScore: 7,
        },
      },

      {
        name: "Realme P1",
        brand: "Realme",

        price: 16999,
        discountPrice: 15499,

        rating: 4.3,
        reviewsCount: 8700,

        images: [
          "https://via.placeholder.com/300",
          "https://via.placeholder.com/300",
        ],

        description: "Affordable gaming smartphone",

        category: "smartphone",

        tags: ["gaming"],

        highlights: [
          "Dimensity 7050",
          "45W Charging",
          "120Hz AMOLED",
        ],

        weaknesses: [
          "Average cameras",
        ],

        specs: {
          ram: 8,
          battery: 5000,
          processorScore: 8,
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