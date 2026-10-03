import { useState, type FormEvent } from "react"
import { cn } from "cn"
import { ArrowRight, LockKeyhole } from "lucide-react"

import { api, type User } from "@/api"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"

export function LoginForm({
  onAuthenticated,
  className,
  ...props
}: React.ComponentProps<"div"> & {
  onAuthenticated: (user: User) => void
}) {
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setSubmitting(true)
    const form = new FormData(event.currentTarget)
    try {
      await api.login(
        String(form.get("email")),
        String(form.get("password")),
      )
      onAuthenticated(await api.currentUser())
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Đăng nhập thất bại")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LockKeyhole className="size-4 text-muted-foreground" />
            Đăng nhập
          </CardTitle>
          <CardDescription>
            Sử dụng tài khoản Open Project để tiếp tục.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  autoComplete="username"
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="password">Mật khẩu</FieldLabel>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  required
                  autoComplete="current-password"
                />
              </Field>
              <Field>
                {error && (
                  <p role="alert" className="text-sm text-destructive">
                    {error}
                  </p>
                )}
                <Button type="submit" disabled={submitting}>
                  {!submitting && <ArrowRight />}
                  {submitting ? "Đang đăng nhập..." : "Đăng nhập"}
                </Button>
                <FieldDescription>
                  Phiên đăng nhập được bảo vệ bằng cookie an toàn.
                </FieldDescription>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
