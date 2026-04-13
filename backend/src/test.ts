import { runEngine } from "./modules/decision-engine/engine"
import { products } from "./data/products"

const queries = [
  "best phone under 20000 for gaming",
  "camera phone under 25000",
  "best battery phone under 20000",
  "gaming phone under 15000",
]

queries.forEach((query) => {
  console.log("\n==============================")
  console.log("QUERY:", query)

  const result = runEngine(query, products)

  console.log("BEST:", result.best?.title)
  console.log("SCORE:", result.best?.score)
  console.log("WHY:", result.best?.explanation)

  console.log("TOP 3:")
  result.top3.forEach((p, i) => {
    console.log(`${i + 1}. ${p.title} (${p.score})`)
  })
})