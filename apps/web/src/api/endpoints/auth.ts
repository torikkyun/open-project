import { api } from "../client";
import type {
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
    api.post<User>("/v1/auth/register", payload),
  login: (payload: AuthLoginPayload) =>
    api.post<AuthLoginResponse>("/v1/auth/login", payload),
  logout: () => api.post<null>("/v1/auth/logout", null),
  refresh: (refreshToken: string) =>
    api.post<AuthRefreshResponse>("/v1/auth/refresh", {
      refresh_token: refreshToken,
    }),
};

export type AuthEndpointGroup = typeof authEndpoints;

export default authEndpoints;
