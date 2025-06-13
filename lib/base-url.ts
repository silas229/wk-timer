/**
 * Get the base URL for the application
 * In production, this should be set via the BASE_URL environment variable
 * In development/test, it falls back to the provided fallback or localhost:3000
 */
export function getBaseUrl(fallback?: string): string {
  const baseUrl = process.env.BASE_URL?.trim();

  // If BASE_URL is set and not empty, and is a valid URL, use it
  if (baseUrl && baseUrl.length > 0 && baseUrl !== "" && baseUrl !== "/") {
    return baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
  }

  // Use provided fallback or default to localhost
  const url = fallback || "http://localhost:3000";
  return url.endsWith("/") ? url.slice(0, -1) : url;
}
