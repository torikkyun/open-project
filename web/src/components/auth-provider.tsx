import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  type ReactNode,
} from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"

import { api, type User } from "@/api"
import { AUTH_EXPIRED_EVENT } from "@/api/client"

const currentUserQueryKey = ["auth", "currentUser"]

type AuthContextValue = {
  user: User | null
  loading: boolean
  login: (user: User) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const currentUserQuery = useQuery<User | null>({
    queryKey: currentUserQueryKey,
    queryFn: () => api.currentUser(),
    enabled: typeof window !== "undefined",
    retry: false,
    staleTime: Infinity,
  })
  const user = currentUserQuery.data ?? null

  useEffect(() => {
    const expireSession = () =>
      queryClient.setQueryData<User | null>(currentUserQueryKey, null)
    window.addEventListener(AUTH_EXPIRED_EVENT, expireSession)
    return () => {
      window.removeEventListener(AUTH_EXPIRED_EVENT, expireSession)
    }
  }, [queryClient])

  const value = useMemo(
    () => ({
      user,
      loading: currentUserQuery.isPending,
      login: (nextUser: User) =>
        queryClient.setQueryData<User | null>(currentUserQueryKey, nextUser),
      logout: () => {
        void api.logout()
        queryClient.setQueryData<User | null>(currentUserQueryKey, null)
      },
    }),
    [currentUserQuery.isPending, queryClient, user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error("useAuth must be used within AuthProvider")
  return context
}
