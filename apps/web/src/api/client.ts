export type ApiMeta = {
  total?: number;
  page?: number;
  limit?: number;
  totalPages?: number;
  [key: string]: unknown;
};

export type ApiEnvelope<T> = {
  data: T;
  meta?: ApiMeta;
  message?: string;
  success?: boolean;
  status_code?: number;
  error?: string;
  details?: unknown;
};

export type ApiError = Error & {
  statusCode: number;
  statusText: string;
  details?: unknown;
  error?: string;
  payload?: unknown;
  isApiError: true;
};

export type RequestParams = Record<
  string,
  string | number | boolean | null | undefined
>;

export type RequestOptions<TBody = unknown> = Omit<RequestInit, "body"> & {
  body?: TBody;
  params?: RequestParams;
  skipAuth?: boolean;
  allowRetry?: boolean;
};

export type ApiClient = {
  get: <T>(path: string, options?: RequestOptions) => Promise<T>;
  post: <T>(
    path: string,
    body?: unknown,
    options?: RequestOptions,
  ) => Promise<T>;
  put: <T>(
    path: string,
    body?: unknown,
    options?: RequestOptions,
  ) => Promise<T>;
  patch: <T>(
    path: string,
    body?: unknown,
    options?: RequestOptions,
  ) => Promise<T>;
  delete: <T>(path: string, options?: RequestOptions) => Promise<T>;
  request: <T>(
    method: string,
    path: string,
    options?: RequestOptions,
  ) => Promise<T>;
};

const DEFAULT_API_BASE_URL = "http://localhost:3100";
const ACCESS_TOKEN_STORAGE_KEY = "access_token";
const REFRESH_TOKEN_STORAGE_KEY = "refresh_token";
const USER_ROLE_STORAGE_KEY = "user_role";

let refreshRequest: Promise<boolean> | null = null;

function safeStorageGet(key: string): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  return localStorage.getItem(key) ?? sessionStorage.getItem(key);
}

function safeStorageSet(key: string, value: string) {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.setItem(key, value);
}

function safeStorageRemove(key: string) {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.removeItem(key);
  sessionStorage.removeItem(key);
}

export function getApiBaseUrl() {
  return (
    (import.meta.env.VITE_API_BASE_URL as string | undefined) ??
    DEFAULT_API_BASE_URL
  ).replace(/\/+$/, "");
}

export function setSessionTokens(
  accessToken: string,
  refreshToken?: string,
  userRole?: string,
) {
  safeStorageSet(ACCESS_TOKEN_STORAGE_KEY, accessToken);

  if (refreshToken) {
    safeStorageSet(REFRESH_TOKEN_STORAGE_KEY, refreshToken);
  }

  if (userRole) {
    safeStorageSet(USER_ROLE_STORAGE_KEY, userRole);
  }
}

export function clearSessionTokens() {
  safeStorageRemove(ACCESS_TOKEN_STORAGE_KEY);
  safeStorageRemove(REFRESH_TOKEN_STORAGE_KEY);
  safeStorageRemove(USER_ROLE_STORAGE_KEY);
}

export function getAccessToken() {
  return safeStorageGet(ACCESS_TOKEN_STORAGE_KEY);
}

export function getRefreshToken() {
  return safeStorageGet(REFRESH_TOKEN_STORAGE_KEY);
}

export function getSessionUserRole() {
  return safeStorageGet(USER_ROLE_STORAGE_KEY);
}

function ensureAbsoluteUrl(path: string) {
  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  const baseUrl = getApiBaseUrl();
  const normalizedPath = path.replace(/^\/+/, "");
  return `${baseUrl}/${normalizedPath}`;
}

function appendQueryString(url: string, params?: RequestParams) {
  if (!params) {
    return url;
  }

  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) {
      continue;
    }

    searchParams.set(key, String(value));
  }

  if (!searchParams.size) {
    return url;
  }

  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}${searchParams.toString()}`;
}

function extractPayloadData<T>(payload: unknown): T {
  if (payload && typeof payload === "object") {
    const record = payload as Record<string, unknown>;

    if (Object.prototype.hasOwnProperty.call(record, "data")) {
      return record.data as T;
    }
  }

  return payload as T;
}

function normalizeApiError(
  status: number,
  statusText: string,
  payload: unknown,
): ApiError {
  const errorRecord = (payload ?? {}) as Record<string, unknown>;
  const message =
    typeof errorRecord.message === "string"
      ? errorRecord.message
      : typeof errorRecord.error === "string"
        ? errorRecord.error
        : "Request failed";

  const details =
    Array.isArray(errorRecord.details) || Array.isArray(errorRecord.errors)
      ? (errorRecord.details ?? errorRecord.errors)
      : (errorRecord.details ?? errorRecord.errors);

  const apiError = new Error(message) as ApiError;
  apiError.name = "ApiError";
  apiError.statusCode = status;
  apiError.statusText = statusText;
  apiError.details = details;
  apiError.error =
    typeof errorRecord.error === "string" ? errorRecord.error : "API_ERROR";
  apiError.payload = payload;
  apiError.isApiError = true;

  return apiError;
}

async function refreshAccessToken() {
  if (refreshRequest) {
    return refreshRequest;
  }

  refreshRequest = (async () => {
    const refreshToken = getRefreshToken();

    if (!refreshToken) {
      clearSessionTokens();
      return false;
    }

    try {
      const response = await fetch(ensureAbsoluteUrl("/v1/auth/refresh"), {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });

      if (!response.ok) {
        clearSessionTokens();
        return false;
      }

      const payload = (await response.json().catch(() => undefined)) as
        | ApiEnvelope<{ access_token?: string }>
        | Record<string, unknown>
        | undefined;
      const accessTokenCandidate =
        (payload && typeof payload === "object" && "data" in payload
          ? (payload as ApiEnvelope<{ access_token?: string }>).data
              ?.access_token
          : undefined) ??
        (payload && typeof payload === "object" && "access_token" in payload
          ? (payload as Record<string, unknown>).access_token
          : undefined);
      const accessToken =
        typeof accessTokenCandidate === "string" ? accessTokenCandidate : null;

      if (!accessToken) {
        clearSessionTokens();
        return false;
      }

      setSessionTokens(accessToken, refreshToken);
      return true;
    } catch {
      clearSessionTokens();
      return false;
    } finally {
      refreshRequest = null;
    }
  })();

  return refreshRequest;
}

async function rawRequest(
  method: string,
  path: string,
  options: RequestOptions = {},
): Promise<{ status: number; statusText: string; payload: unknown }> {
  const url = appendQueryString(ensureAbsoluteUrl(path), options.params);
  const headers = new Headers(options.headers ?? {});

  if (options.body !== undefined && !(options.body instanceof FormData)) {
    if (!headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }
  }

  if (!options.skipAuth) {
    const accessToken = getAccessToken();
    if (accessToken && !headers.has("Authorization")) {
      headers.set("Authorization", `Bearer ${accessToken}`);
    }
  }

  const requestInit: RequestInit = {
    ...options,
    method,
    credentials: "include",
    headers,
  } as RequestInit;

  if (options.body !== undefined) {
    requestInit.body =
      options.body instanceof FormData
        ? options.body
        : JSON.stringify(options.body as unknown);
  }

  const response = await fetch(url, requestInit);
  const contentType = response.headers.get("content-type") ?? "";
  const payload = contentType.includes("application/json")
    ? await response.json().catch(() => undefined)
    : await response.text().catch(() => undefined);

  return {
    status: response.status,
    statusText: response.statusText,
    payload,
  };
}

export async function request<T>(
  method: string,
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const result = await rawRequest(method, path, options);

  if (result.status === 401 && !options.skipAuth && !options.allowRetry) {
    const didRefresh = await refreshAccessToken();

    if (didRefresh) {
      return request<T>(method, path, {
        ...options,
        allowRetry: true,
      });
    }
  }

  if (result.status >= 400) {
    throw normalizeApiError(result.status, result.statusText, result.payload);
  }

  if (result.payload === undefined) {
    return undefined as T;
  }

  return extractPayloadData<T>(result.payload);
}

export function createApiClient(baseUrl = getApiBaseUrl()): ApiClient {
  const client: ApiClient = {
    get: <T>(path: string, options: RequestOptions = {}) =>
      request<T>("GET", path, { ...options, params: options.params }),
    post: <T>(path: string, body?: unknown, options: RequestOptions = {}) =>
      request<T>("POST", path, { ...options, body }),
    put: <T>(path: string, body?: unknown, options: RequestOptions = {}) =>
      request<T>("PUT", path, { ...options, body }),
    patch: <T>(path: string, body?: unknown, options: RequestOptions = {}) =>
      request<T>("PATCH", path, { ...options, body }),
    delete: <T>(path: string, options: RequestOptions = {}) =>
      request<T>("DELETE", path, options),
    request: <T>(method: string, path: string, options: RequestOptions = {}) =>
      request<T>(method, path, options),
  };

  return Object.assign(client, {
    baseUrl,
  });
}

export const api = createApiClient();

/**
 * Query invalidation convention for later TanStack Query usage:
 * - keep key roots stable (e.g. ["projects"], ["tasks", projectId])
 * - invalidate the root after mutation success, not before
 * - prefer optimistic updates only when rollback is handled
 */
export const queryInvalidation = {
  invalidateRoot: (root: string[]) => root,
};

export default api;
