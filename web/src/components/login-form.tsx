import { useState, type FormEvent } from "react"
import { Link } from "@tanstack/react-router"
import { cn } from "cn"
import { ArrowRight, Eye, EyeOff, LockKeyhole, ShieldCheck } from "lucide-react"

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
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group"
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
  const [showPassword, setShowPassword] = useState(false)

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
      <Card className="border-border/70 shadow-lg shadow-foreground/5">
        <CardHeader className="gap-3 pb-5">
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <LockKeyhole />
          </div>
          <div className="flex flex-col gap-1.5">
            <CardTitle className="text-xl">Chào mừng trở lại</CardTitle>
            <CardDescription>
              Đăng nhập để tiếp tục làm việc trong Open Project.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} noValidate={false}>
            <FieldGroup>
              <Field data-invalid={!!error}>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  autoCapitalize="none"
                  autoComplete="username"
                  autoCorrect="off"
                  spellCheck={false}
                  aria-invalid={!!error}
                  aria-describedby={error ? "login-error" : undefined}
                  placeholder="ten@congty.com"
                />
              </Field>
              <Field data-invalid={!!error}>
                <div className="flex items-center justify-between gap-2">
                  <FieldLabel htmlFor="password">Mật khẩu</FieldLabel>
                  <Link
                    to="/reset"
                    className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                  >
                    Quên mật khẩu?
                  </Link>
                </div>
                <InputGroup>
                  <InputGroupInput
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    autoComplete="current-password"
                    aria-invalid={!!error}
                    aria-describedby={error ? "login-error" : undefined}
                    placeholder="Nhập mật khẩu"
                  />
                  <InputGroupAddon align="inline-end">
                    <InputGroupButton
                      type="button"
                      aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                      aria-pressed={showPassword}
                      onClick={() => setShowPassword((visible) => !visible)}
                    >
                      {showPassword ? <EyeOff /> : <Eye />}
                    </InputGroupButton>
                  </InputGroupAddon>
                </InputGroup>
              </Field>
              <Field>
                {error && (
                  <p
                    id="login-error"
                    role="alert"
                    className="text-sm text-destructive"
                  >
                    {error}
                  </p>
                )}
                <Button
                  type="submit"
                  className="w-full"
                  disabled={submitting}
                >
                  {submitting ? "Đang đăng nhập..." : "Đăng nhập"}
                  {!submitting && <ArrowRight data-icon="inline-end" />}
                </Button>
                <FieldDescription className="flex items-center justify-center gap-2 pt-1">
                  <ShieldCheck />
                  Phiên làm việc được bảo vệ an toàn.
                </FieldDescription>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
