import {
  SearchResponse,
} from "@/types/search";

// ======================================================
// Configuration
// ======================================================

const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000";

// ======================================================
// API Response
// ======================================================

interface SearchApiResponse {
  success: boolean;

  data: SearchResponse;

  meta?: unknown;

  error?: string;
}

// ======================================================
// Search Products
// ======================================================

export async function searchProducts(
  query: string,
  intent: string[] = ["balanced"]
): Promise<SearchResponse> {

  const normalizedQuery =
    query.trim();

  if (!normalizedQuery) {
    throw new Error(
      "Search query is required"
    );
  }

  // ====================================================
  // Normalize Intent
  // ====================================================

  const normalizedIntent =
    Array.from(
      new Set(
        intent
          .map((value) => value.trim().toLowerCase())
          .filter(Boolean)
      )
    );

  const finalIntent =
    normalizedIntent.length > 0
      ? normalizedIntent
      : ["balanced"];

  // ====================================================
  // Build Query Parameters
  // ====================================================

  const searchParams =
    new URLSearchParams();

  searchParams.set(
    "q",
    normalizedQuery
  );

  searchParams.set(
    "intent",
    finalIntent.join(",")
  );

  const url =
    `${BASE_URL}/api/search?${searchParams.toString()}`;

  // ====================================================
  // Request
  // ====================================================

  let res: Response;

  try {

    res = await fetch(url, {
      method: "GET",

      headers: {
        Accept:
          "application/json",
      },

      cache: "no-store",
    });

  } catch (error: unknown) {

    if (error instanceof Error) {
      throw new Error(
        `Unable to connect to Shopio API: ${error.message}`
      );
    }

    throw new Error(
      "Unable to connect to Shopio API"
    );
  }

  // ====================================================
  // HTTP Error
  // ====================================================

  if (!res.ok) {

    const text =
      await res
        .text()
        .catch(() => "");

    let message =
      `Failed to fetch (${res.status})`;

    if (text.trim()) {

      try {

        const errorBody =
          JSON.parse(text) as {
            error?: string;
            message?: string;
          };

        message =
          errorBody.error ??
          errorBody.message ??
          `${message} ${text}`;

      } catch {

        message =
          `${message} ${text}`;
      }
    }

    throw new Error(message);
  }

  // ====================================================
  // Parse Response
  // ====================================================

  let body: SearchApiResponse;

  try {

    body =
      (await res.json()) as SearchApiResponse;

  } catch {

    throw new Error(
      "Shopio API returned invalid JSON"
    );
  }

  // ====================================================
  // API Error
  // ====================================================

  if (!body.success) {

    throw new Error(
      body.error ||
        "Search request failed"
    );
  }

  // ====================================================
  // Validate Search Data
  // ====================================================

  if (
    !body.data ||
    typeof body.data !== "object"
  ) {

    throw new Error(
      "Shopio API returned invalid search data"
    );
  }

  // ====================================================
  // Return Search Result
  // ====================================================

  return body.data;
}