import { api } from "../client";
import type {
  ApiSingleResponse,
  AuthLoginPayload,
  AuthLoginResponse,
  AuthRefreshResponse,
  AuthRegisterPayload,
  User,
} from "../contracts";

export const authQueryKeys = {
  register: ["auth", "register"],
  login: ["auth", "login"],
  logout: ["auth", "logout"],
  refresh: ["auth", "refresh"],
  me: ["auth", "me"],
} as const;

export const authEndpoints = {
  register: (payload: AuthRegisterPayload) =>
    api.post<ApiSingleResponse<User>>("/v1/auth/register", payload),
  login: (payload: AuthLoginPayload) =>
    api.post<ApiSingleResponse<AuthLoginResponse>>("/v1/auth/login", payload),
  logout: () => api.post<ApiSingleResponse<null>>("/v1/auth/logout", null),
  refresh: (refreshToken: string) =>
    api.post<ApiSingleResponse<AuthRefreshResponse>>("/v1/auth/refresh", {
      refresh_token: refreshToken,
    }),
};

export type AuthEndpointGroup = typeof authEndpoints;

export default authEndpoints;
