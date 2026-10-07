const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000/api/v1"
).replace(/\/+$/, "")

export function assetUrl(path: string): string {
  return path.startsWith("http") ? path : `${API_BASE_URL.replace(/\/api\/v1$/, "")}${path}`
}

export function apiUrl(path: string): string {
  return `${API_BASE_URL}${path}`
}

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
  return `Yêu cầu thất bại (${status})`
}

export async function request<T>(
  path: string,
  init: RequestInit = {},
  authenticated = true,
  retry = true,
): Promise<T> {
  const headers = new Headers(init.headers)
  if (
    init.body &&
    !(init.body instanceof FormData) &&
    !headers.has("Content-Type")
  ) {
    headers.set("Content-Type", "application/json")
  }

  let response: Response
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers,
      credentials: "include",
    })
  } catch (error) {
    if (error instanceof TypeError) {
      throw new ApiError("Không thể kết nối API. Hãy kiểm tra địa chỉ API.", 0)
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
    if (
      response.status === 401 &&
      authenticated &&
      retry &&
      path !== "/auth/refresh" &&
      path !== "/auth/login" &&
      path !== "/auth/logout"
    ) {
      try {
        await request("/auth/refresh", { method: "POST" }, false)
        return request<T>(path, init, true, false)
      } catch {
        window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT))
      }
    }
    throw new ApiError(errorMessage(payload, response.status), response.status)
  }

  if (response.status === 204) return undefined as T
  return (await response.json()) as T
}