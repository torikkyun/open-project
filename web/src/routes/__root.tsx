import type { ReactNode } from 'react'
import appCss from "@/assets/styles/globals.css?url";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import {
  Outlet,
  createRootRoute,
  HeadContent,
  Scripts,
} from '@tanstack/react-router'
import { useEffect, useState } from "react"
import { AuthProvider } from "@/components/auth-provider"
import { applyTheme, onThemeChange, readTheme } from "@/lib/theme"

export const Route = createRootRoute({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: 'Open Project',
      },
    ],
    links: [{ rel: 'stylesheet', href: appCss }],
  }),
  component: RootComponent,
})

function RootComponent() {
  // ponytail: áp theme sau khi mount nên trang nháy sáng lúc tải; thêm script
  // inline ở head nếu cần hết nháy.
  useEffect(() => {
    applyTheme(readTheme())
    return onThemeChange(() => applyTheme(readTheme()))
  }, [])

  return (
    <QueryProvider>
      <AuthProvider>
        <RootDocument>
          <Outlet />
        </RootDocument>
      </AuthProvider>
    </QueryProvider>
  )
}

function QueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () => new QueryClient({ defaultOptions: { queries: { retry: false } } }),
  )
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}

function RootDocument({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html>
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  )
}
