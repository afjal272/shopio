import express from "express"
import cors from "cors"
import { searchRouter } from "./routes/search.route"

const app = express()

// middlewares
app.use(cors())
app.use(express.json())

// health check (production must-have)
app.get("/health", (_, res) => {
  res.json({ status: "ok" })
})

// API routes (clean structure)
app.use("/api/search", searchRouter)

// global error handler (important)
app.use((err: any, req: any, res: any, next: any) => {
  console.error(err)
  res.status(500).json({ error: "Internal Server Error" })
})

const PORT = process.env.PORT || 5000

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`)
})