import { runEngine } from "./modules/decision-engine/engine"
import { products } from "./data/products"

const result = runEngine("best phone under 20000 for gaming", products)

console.log(JSON.stringify(result, null, 2))