import express from "express"
import cors from "cors"
import { searchRouter } from "./routes/search.route"

const app = express()

app.use(cors())
app.use(express.json())

app.use("/search", searchRouter)

const PORT = 5000

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})