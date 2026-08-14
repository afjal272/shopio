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

  // ----------------------------------------------------
  // Intent
  // ----------------------------------------------------
  //
  // Intent is currently not sent to the backend.
  // It remains part of the service contract for future
  // search-intent support.
  //
  void intent;

  // ----------------------------------------------------
  // Build URL
  // ----------------------------------------------------

  const url =
    `${BASE_URL}/api/search?q=${encodeURIComponent(
      normalizedQuery
    )}`;

  // ----------------------------------------------------
  // Request
  // ----------------------------------------------------

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

  // ----------------------------------------------------
  // HTTP Error
  // ----------------------------------------------------

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

  // ----------------------------------------------------
  // Parse Response
  // ----------------------------------------------------

  let body: SearchApiResponse;

  try {

    body =
      (await res.json()) as SearchApiResponse;

  } catch {

    throw new Error(
      "Shopio API returned invalid JSON"
    );
  }

  // ----------------------------------------------------
  // API Error
  // ----------------------------------------------------

  if (!body.success) {

    throw new Error(
      body.error ||
        "Search request failed"
    );
  }

  // ----------------------------------------------------
  // Validate Search Data
  // ----------------------------------------------------

  if (
    !body.data ||
    typeof body.data !== "object"
  ) {

    throw new Error(
      "Shopio API returned invalid search data"
    );
  }

  // ----------------------------------------------------
  // Return Actual Search Result
  // ----------------------------------------------------
  //
  // Backend response:
  //
  // {
  //   success: true,
  //   data: {
  //     best,
  //     recommendations,
  //     parsed,
  //     comparison,
  //     notRecommended,
  //     suggestions,
  //     isRelaxed
  //   }
  // }
  //
  // Results.tsx expects the inner `data` object,
  // not the complete API wrapper.
  //

  return body.data;
}