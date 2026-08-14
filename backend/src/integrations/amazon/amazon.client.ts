import {
  AmazonApiConfig,
  AmazonProductSearchParams,
  AmazonProductSearchResponse,
} from "./amazon.types";

// ======================================================
// Constants
// ======================================================

const DEFAULT_BASE_URL =
  "https://real-time-amazon-data.p.rapidapi.com";

const DEFAULT_COUNTRY = "IN";

const DEFAULT_TIMEOUT_MS = 15_000;

const MAX_RETRIES = 2;

const RETRYABLE_STATUS_CODES = new Set([
  408,
  425,
  429,
  500,
  502,
  503,
  504,
]);

// ======================================================
// Amazon API Client
// ======================================================

export class AmazonClient {
  private readonly apiKey: string;

  private readonly apiHost: string;

  private readonly baseUrl: string;

  private readonly country: string;

  private readonly timeoutMs: number;

  constructor(
    config: Partial<AmazonApiConfig> = {}
  ) {
    const apiKey =
      config.apiKey?.trim() ||
      process.env.RAPIDAPI_KEY?.trim() ||
      "";

    const apiHost =
      config.apiHost?.trim() ||
      process.env.RAPIDAPI_HOST?.trim() ||
      "";

    if (!apiKey) {
      throw new Error(
        "RAPIDAPI_KEY is not configured"
      );
    }

    if (!apiHost) {
      throw new Error(
        "RAPIDAPI_HOST is not configured"
      );
    }

    const baseUrl =
      config.baseUrl?.trim() ||
      DEFAULT_BASE_URL;

    if (!isValidHttpUrl(baseUrl)) {
      throw new Error(
        "RAPIDAPI base URL is invalid"
      );
    }

    const timeoutMs =
      config.timeoutMs ??
      DEFAULT_TIMEOUT_MS;

    if (
      !Number.isFinite(timeoutMs) ||
      timeoutMs <= 0
    ) {
      throw new Error(
        "Amazon API timeout must be a positive number"
      );
    }

    this.apiKey = apiKey;

    this.apiHost = apiHost;

    this.baseUrl =
      removeTrailingSlash(baseUrl);

    this.country =
      normalizeCountry(
        config.country
      );

    this.timeoutMs =
      Math.round(timeoutMs);
  }

  // ====================================================
  // Product Search
  // ====================================================

  async searchProducts(
    params: AmazonProductSearchParams
  ): Promise<AmazonProductSearchResponse> {
    const query =
      normalizeQuery(
        params.query
      );

    if (!query) {
      throw new Error(
        "Amazon search query cannot be empty"
      );
    }

    const page =
      params.page ?? 1;

    validatePage(page);

    const country =
      normalizeCountry(
        params.country
      ) || this.country;

    const searchParams =
      new URLSearchParams();

    searchParams.set(
      "query",
      query
    );

    searchParams.set(
      "country",
      country
    );

    searchParams.set(
      "page",
      String(page)
    );

    const category =
      normalizeOptionalString(
        params.category
      );

    if (category) {
      searchParams.set(
        "category",
        category
      );
    }

    const url =
      `${this.baseUrl}/search?${searchParams.toString()}`;

    return this.request(url);
  }

  // ====================================================
  // HTTP Request
  // ====================================================

  private async request(
    url: string
  ): Promise<AmazonProductSearchResponse> {
    let lastError: unknown = null;

    for (
      let attempt = 0;
      attempt <= MAX_RETRIES;
      attempt += 1
    ) {
      try {
        return await this.requestOnce(
          url
        );
      } catch (error: unknown) {
        lastError = error;

        if (
          !this.isRetryableError(
            error
          ) ||
          attempt === MAX_RETRIES
        ) {
          throw error;
        }

        await delay(
          getRetryDelay(
            attempt
          )
        );
      }
    }

    throw (
      lastError instanceof Error
        ? lastError
        : new Error(
            "Amazon API request failed"
          )
    );
  }

  // ====================================================
  // Single HTTP Attempt
  // ====================================================

  private async requestOnce(
    url: string
  ): Promise<AmazonProductSearchResponse> {
    const controller =
      new AbortController();

    const timeout =
      setTimeout(
        () =>
          controller.abort(),
        this.timeoutMs
      );

    try {
      const response =
        await fetch(url, {
          method: "GET",

          headers: {
            Accept:
              "application/json",

            "X-RapidAPI-Key":
              this.apiKey,

            "X-RapidAPI-Host":
              this.apiHost,
          },

          signal:
            controller.signal,
        });

      const responseText =
        await response.text();

      const data =
        parseResponseBody(
          responseText
        );

      if (!response.ok) {
        throw new AmazonApiError(
          this.buildHttpErrorMessage(
            response.status,
            data
          ),
          response.status
        );
      }

      if (!isRecord(data)) {
        throw new Error(
          "Amazon API returned an invalid response body"
        );
      }

      return data as AmazonProductSearchResponse;
    } catch (error: unknown) {
      if (
        isAbortError(error)
      ) {
        throw new Error(
          `Amazon API request timed out after ${this.timeoutMs}ms`
        );
      }

      if (
        error instanceof Error
      ) {
        throw error;
      }

      throw new Error(
        "Amazon API request failed"
      );
    } finally {
      clearTimeout(timeout);
    }
  }

  // ====================================================
  // Retry Decision
  // ====================================================

  private isRetryableError(
    error: unknown
  ): boolean {
    if (
      error instanceof AmazonApiError
    ) {
      return RETRYABLE_STATUS_CODES.has(
        error.status
      );
    }

    /*
     * Network-level failures are also retryable.
     * Validation/configuration errors are not.
     */
    return (
      error instanceof TypeError
    );
  }

  // ====================================================
  // Error Handling
  // ====================================================

  private buildHttpErrorMessage(
    status: number,
    data: unknown
  ): string {
    const details =
      this.extractErrorMessage(
        data
      );

    return details
      ? `Amazon API request failed (${status}): ${details}`
      : `Amazon API request failed with status ${status}`;
  }

  private extractErrorMessage(
    data: unknown
  ): string | null {
    if (
      typeof data === "string" &&
      data.trim()
    ) {
      return data.trim();
    }

    if (
      !isRecord(data)
    ) {
      return null;
    }

    const candidates = [
      data.message,
      data.error,
      data.detail,
      data.status,
    ];

    for (
      const candidate of candidates
    ) {
      if (
        typeof candidate === "string" &&
        candidate.trim()
      ) {
        return candidate.trim();
      }
    }

    return null;
  }
}

// ======================================================
// Amazon API Error
// ======================================================

class AmazonApiError extends Error {
  readonly status: number;

  constructor(
    message: string,
    status: number
  ) {
    super(message);

    this.name =
      "AmazonApiError";

    this.status =
      status;
  }
}

// ======================================================
// Runtime Helpers
// ======================================================

function isRecord(
  value: unknown
): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function parseResponseBody(
  responseText: string
): unknown {
  if (!responseText.trim()) {
    return null;
  }

  try {
    return JSON.parse(
      responseText
    ) as unknown;
  } catch {
    return responseText;
  }
}

function normalizeQuery(
  value: string
): string {
  if (
    typeof value !== "string"
  ) {
    return "";
  }

  return value
    .trim()
    .replace(/\s+/g, " ");
}

function normalizeOptionalString(
  value?: string
): string | undefined {
  if (
    typeof value !== "string"
  ) {
    return undefined;
  }

  const normalized =
    value.trim();

  return normalized || undefined;
}

function normalizeCountry(
  value?: string
): string {
  return (
    value?.trim() ||
    DEFAULT_COUNTRY
  ).toUpperCase();
}

function validatePage(
  page: number
): void {
  if (
    !Number.isInteger(page) ||
    page < 1
  ) {
    throw new Error(
      "Amazon search page must be a positive integer"
    );
  }
}

function isValidHttpUrl(
  value: string
): boolean {
  try {
    const url =
      new URL(value);

    return (
      url.protocol ===
        "https:" ||
      url.protocol ===
        "http:"
    );
  } catch {
    return false;
  }
}

function removeTrailingSlash(
  value: string
): string {
  return value.replace(
    /\/+$/,
    ""
  );
}

function isAbortError(
  error: unknown
): boolean {
  return (
    error instanceof DOMException &&
    error.name === "AbortError"
  );
}

function getRetryDelay(
  attempt: number
): number {
  return Math.min(
    1_000 *
      2 ** attempt,
    5_000
  );
}

function delay(
  milliseconds: number
): Promise<void> {
  return new Promise(
    (resolve) =>
      setTimeout(
        resolve,
        milliseconds
      )
  );
}

// ======================================================
// Default Client
// ======================================================

export const amazonClient =
  new AmazonClient();