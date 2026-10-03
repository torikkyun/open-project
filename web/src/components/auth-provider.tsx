import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"

import { api, type User } from "@/api"
import { AUTH_EXPIRED_EVENT } from "@/api/client"

type AuthContextValue = {
  user: User | null
  loading: boolean
  login: (user: User) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    api
      .currentUser()
      .then((currentUser) => {
        if (active) setUser(currentUser)
      })
      .catch(() => {
        if (active) setUser(null)
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    const expireSession = () => setUser(null)
    window.addEventListener(AUTH_EXPIRED_EVENT, expireSession)
    return () => {
      active = false
      window.removeEventListener(AUTH_EXPIRED_EVENT, expireSession)
    }
  }, [])

  const value = useMemo(
    () => ({
      user,
      loading,
      login: setUser,
      logout: () => {
        void api.logout()
        setUser(null)
      },
    }),
    [loading, user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error("useAuth must be used within AuthProvider")
  return context
}
