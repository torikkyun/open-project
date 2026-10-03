const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000/api/v1"
).replace(/\/+$/, "")

const TOKEN_KEY = "open-project-access-token"
export const AUTH_EXPIRED_EVENT = "open-project:auth-expired"

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message)
    this.name = "ApiError"
  }
}

export function getAccessToken(): string | null {
  return typeof window === "undefined"
    ? null
    : window.sessionStorage.getItem(TOKEN_KEY)
}

export function setAccessToken(token: string): void {
  window.sessionStorage.setItem(TOKEN_KEY, token)
}

export function clearAccessToken(): void {
  if (typeof window !== "undefined") {
    window.sessionStorage.removeItem(TOKEN_KEY)
  }
}

function errorMessage(payload: unknown, status: number): string {
  if (typeof payload === "object" && payload !== null && "detail" in payload) {
    const detail = payload.detail
    if (typeof detail === "string") return detail
    if (Array.isArray(detail)) {
      const messages = detail.flatMap((item: unknown) =>
        typeof item === "object" &&
        item !== null &&
        "msg" in item &&
        typeof item.msg === "string"
          ? [item.msg]
          : [],
      )
      if (messages.length) return messages.join(", ")
    }
  }
  return `Request failed (${status})`
}

export async function request<T>(
  path: string,
  init: RequestInit = {},
  authenticated = true,
): Promise<T> {
  const headers = new Headers(init.headers)
  const token = authenticated ? getAccessToken() : null
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json")
  }
  if (token) headers.set("Authorization", `Bearer ${token}`)

  let response: Response
  try {
    response = await fetch(`${API_BASE_URL}${path}`, { ...init, headers })
  } catch (error) {
    if (error instanceof TypeError) {
      throw new ApiError("Cannot connect to the API. Check the API URL.", 0)
    }
    throw error
  }

  if (!response.ok) {
    const text = await response.text()
    let payload: unknown = text
    try {
      payload = text ? JSON.parse(text) : null
    } catch {
      payload = text
    }
    if (response.status === 401 && token) {
      clearAccessToken()
      window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT))
    }
    throw new ApiError(errorMessage(payload, response.status), response.status)
  }

  if (response.status === 204) return undefined as T
  return (await response.json()) as T
}