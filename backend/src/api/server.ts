import "dotenv/config";

import express, {
  NextFunction,
  Request,
  Response,
} from "express";

import cors from "cors";

import { searchRouter } from "./routes/search.route";
import { productRouter } from "./routes/product.route";

// ======================================================
// App
// ======================================================

const app = express();

// ======================================================
// Configuration
// ======================================================

const PORT =
  Number(process.env.PORT) || 5000;

const FRONTEND_URL =
  process.env.FRONTEND_URL?.trim() ||
  "http://localhost:3000";

// ======================================================
// Allowed Origins
// ======================================================

const allowedOrigins = new Set(
  [
    FRONTEND_URL,

    "http://localhost:3000",

    "http://127.0.0.1:3000",
  ]
    .map(normalizeOrigin)
    .filter(
      (
        origin
      ): origin is string =>
        Boolean(origin)
    )
);

// ======================================================
// CORS
// ======================================================

app.use(
  cors({
    origin: (
      origin,
      callback
    ) => {

      // ----------------------------------------------
      // Non-browser / same-origin requests
      // ----------------------------------------------

      if (!origin) {
        callback(null, true);
        return;
      }

      const normalizedOrigin =
        normalizeOrigin(origin);

      // ----------------------------------------------
      // Allowed Origin
      // ----------------------------------------------

      if (
        normalizedOrigin &&
        allowedOrigins.has(
          normalizedOrigin
        )
      ) {
        callback(null, true);
        return;
      }

      console.error(
        `CORS blocked origin: ${origin}`
      );

      callback(
        new Error(
          `CORS blocked origin: ${origin}`
        )
      );
    },

    credentials: true,

    methods: [
      "GET",
      "POST",
      "PUT",
      "PATCH",
      "DELETE",
      "OPTIONS",
    ],

    allowedHeaders: [
      "Content-Type",
      "Authorization",
    ],
  })
);

// ======================================================
// Body Parsing
// ======================================================

app.use(
  express.json({
    limit: "1mb",
  })
);

// ======================================================
// Health Check
// ======================================================

app.get(
  "/health",
  (
    _req: Request,
    res: Response
  ) => {
    return res.status(200).json({
      success: true,
      status: "ok",
    });
  }
);

// ======================================================
// API Routes
// ======================================================

app.use(
  "/api/search",
  searchRouter
);

app.use(
  "/api",
  productRouter
);

// ======================================================
// 404 Handler
// ======================================================

app.use(
  (
    req: Request,
    res: Response
  ) => {
    return res.status(404).json({
      success: false,
      error: "Route not found",
      path: req.originalUrl,
    });
  }
);

// ======================================================
// Global Error Handler
// ======================================================

app.use(
  (
    err: unknown,
    _req: Request,
    res: Response,
    _next: NextFunction
  ) => {

    console.error(
      "SERVER ERROR:",
      err
    );

    const message =
      err instanceof Error
        ? err.message
        : "Internal server error";

    // ----------------------------------------------
    // CORS Error
    // ----------------------------------------------

    if (
      message
        .toLowerCase()
        .startsWith("cors blocked")
    ) {
      return res.status(403).json({
        success: false,
        error: "CORS blocked",
      });
    }

    // ----------------------------------------------
    // Generic Error
    // ----------------------------------------------

    return res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
);

// ======================================================
// Start Server
// ======================================================

app.listen(
  PORT,
  () => {
    console.log(
      `Shopio backend running on port ${PORT}`
    );

    console.log(
      "Allowed frontend origins:"
    );

    for (
      const origin of allowedOrigins
    ) {
      console.log(
        `- ${origin}`
      );
    }
  }
);

// ======================================================
// Helpers
// ======================================================

function normalizeOrigin(
  origin: string
): string | null {

  const normalized =
    origin.trim();

  if (!normalized) {
    return null;
  }

  return normalized.replace(
    /\/+$/,
    ""
  );
}