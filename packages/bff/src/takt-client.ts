export function isTaktApiConfigured() {
  return Boolean(process.env.TAKT_API_BASE_URL);
}

function getApiBaseUrl() {
  const baseUrl = process.env.TAKT_API_BASE_URL?.replace(/\/$/, "");

  if (!baseUrl) {
    throw new Error("TAKT_API_BASE_URL is not configured");
  }

  return baseUrl;
}

export function getBearerToken(authorization?: string) {
  if (!authorization?.startsWith("Bearer ")) {
    return undefined;
  }

  return authorization.slice("Bearer ".length).trim() || undefined;
}

export async function taktApiFetch<T>(
  path: string,
  token: string,
  init: RequestInit = {},
): Promise<T> {
  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      "ngrok-skip-browser-warning": "true",
      ...init.headers,
    },
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(
      errorBody.message ||
        errorBody.error ||
        `TAKT API returned ${response.status}`,
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}
