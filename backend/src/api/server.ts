import express, { Request, Response, NextFunction } from "express"
import cors from "cors"

import { searchRouter } from "./routes/search.route"
import { productRouter } from "./routes/product.route" // 🔥 ADD THIS

const app = express()

// 🔥 MIDDLEWARES
app.use(cors({
  origin: ["http://localhost:3000"],
  credentials: true
}))
app.use(express.json())

// 🔥 HEALTH CHECK (production must-have)
app.get("/health", (_: Request, res: Response) => {
  res.json({ status: "ok" })
})

// 🔥 API ROUTES
app.use("/api/search", searchRouter)
app.use("/api", productRouter) // 🔥 ADD THIS

// 🔥 GLOBAL ERROR HANDLER
app.use((err: unknown, req: Request, res: Response, next: NextFunction) => {
  console.error("❌ SERVER ERROR:", err)

  res.status(500).json({
    message: "Internal Server Error",
  })
})

// 🔥 START SERVER
const PORT = process.env.PORT || 5000

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`)
})