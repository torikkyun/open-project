import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { useEffect, type FormEvent } from "react"

import { api, type User } from "@/api"
import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export const Route = createFileRoute("/_app/admin/users")({
  component: AccountManagementPage,
})

function AccountManagementPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const usersQuery = useQuery({
    queryKey: ["users"],
    queryFn: api.listUsers,
    enabled: user?.role === "admin",
  })
  const createUserMutation = useMutation({
    mutationFn: api.createUser,
    onSuccess: (createdUser) => {
      queryClient.setQueryData<User[]>(["users"], (users) => [
        ...(users ?? []),
        createdUser,
      ])
    },
  })

  useEffect(() => {
    if (user && user.role !== "admin") {
      void navigate({ to: "/", replace: true })
    }
  }, [navigate, user])

  if (user?.role !== "admin") return null

  function createUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const data = new FormData(form)
    createUserMutation.mutate(
      {
        email: String(data.get("email")),
        full_name: String(data.get("full_name")),
        password: String(data.get("password")),
      },
      { onSuccess: () => form.reset() },
    )
  }

  return (
    <main className="min-h-[calc(100svh-3.75rem)] bg-muted/30 p-4 sm:p-6">
      <div className="mx-auto max-w-7xl space-y-6 rounded-lg border bg-background p-5">
        <section className="space-y-4">
          <div>
            <h1 className="text-xl font-semibold">Quản lý tài khoản</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Tạo và xem tài khoản trong không gian làm việc.
            </p>
          </div>
          <form
            onSubmit={createUser}
            className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4"
          >
            <Input
              name="full_name"
              placeholder="Họ và tên"
              required
              maxLength={160}
              aria-label="Họ và tên"
            />
            <Input
              name="email"
              type="email"
              placeholder="Email"
              required
              aria-label="Email"
            />
            <Input
              name="password"
              type="password"
              placeholder="Mật khẩu (ít nhất 12 ký tự)"
              minLength={12}
              maxLength={128}
              required
              aria-label="Mật khẩu"
            />
            <Button type="submit" disabled={createUserMutation.isPending}>
              Tạo tài khoản
            </Button>
          </form>
          {createUserMutation.error && (
            <p role="alert" className="text-sm text-destructive">
              {createUserMutation.error.message}
            </p>
          )}
          {usersQuery.error && (
            <p role="alert" className="text-sm text-destructive">
              {usersQuery.error.message}
            </p>
          )}
          {usersQuery.isPending ? (
            <p className="text-sm text-muted-foreground">
              Đang tải tài khoản...
            </p>
          ) : (
            <div className="divide-y">
              {usersQuery.data?.map((account) => (
                <div
                  key={account.id}
                  className="flex flex-wrap justify-between gap-2 py-3 text-sm"
                >
                  <span>
                    {account.full_name} · {account.email}
                  </span>
                  <span className="text-muted-foreground">
                    {account.role} · {account.is_active ? "active" : "inactive"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  )
}
