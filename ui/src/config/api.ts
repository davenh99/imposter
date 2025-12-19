/**
 * Get the API URL for both development and production
 * - In dev: connects to localhost:8080 (Go backend)
 * - In prod: uses same origin (served behind nginx proxy)
 */
export function getApiUrl(): string {
  const envUrl = import.meta.env.VITE_PUBLIC_API_URL;

  if (envUrl) {
    return envUrl;
  }

  if (window.location.origin.includes("localhost") || window.location.origin.includes("127.0.0.1")) {
    return "http://127.0.0.1:8080";
  }

  return window.location.origin;
}

export function getWebSocketUrl(path: string): string {
  const apiUrl = getApiUrl();
  const proto = apiUrl.startsWith("https") ? "wss" : "ws";
  // Remove http/https protocol and replace with ws/wss
  const host = apiUrl.replace(/^https?:\/\//, "");
  return `${proto}://${host}${path}`;
}
