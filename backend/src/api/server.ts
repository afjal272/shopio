import express, { Request, Response, NextFunction } from "express"
import cors from "cors"

import { searchRouter } from "./routes/search.route"
import { productRouter } from "./routes/product.route"

const app = express()

// 🔥 ALLOWED ORIGINS
const allowedOrigins = [
  process.env.FRONTEND_URL,
  "http://localhost:3000",
]

// 🔥 MIDDLEWARES
app.use(
  cors({
    origin: (origin, callback) => {
      // allow requests without origin
      // (mobile apps, postman, server-to-server)
      if (!origin) {
        return callback(null, true)
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true)
      }

      return callback(new Error("Not allowed by CORS"))
    },
    credentials: true,
  })
)

app.use(express.json())

// 🔥 HEALTH CHECK (production must-have)
app.get("/health", (_: Request, res: Response) => {
  res.json({ status: "ok" })
})

// 🔥 API ROUTES
app.use("/api/search", searchRouter)
app.use("/api", productRouter)

// 🔥 GLOBAL ERROR HANDLER
app.use(
  (
    err: unknown,
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    console.error("❌ SERVER ERROR:", err)

    res.status(500).json({
      message: "Internal Server Error",
    })
  }
)

// 🔥 START SERVER
const PORT = process.env.PORT || 5000

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`)
})