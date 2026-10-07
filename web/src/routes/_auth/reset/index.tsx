import { useState, type FormEvent } from "react";
import { Link, createFileRoute } from "@tanstack/react-router";
import { KeyRound } from "lucide-react";

import { api } from "@/api";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/_auth/reset/")({
  validateSearch: (search: Record<string, unknown>) => ({
    token: typeof search.token === "string" ? search.token : undefined,
  }),
  component: ResetPasswordPage,
});

function ResetShell({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <main className="flex min-h-svh items-center justify-center bg-muted/20 p-5 sm:p-10">
      <div className="w-full max-w-md">
        <Card className="border-border/70 shadow-lg shadow-foreground/5">
          <CardHeader className="gap-3 pb-5">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <KeyRound />
            </div>
            <div className="flex flex-col gap-1.5">
              <CardTitle className="text-xl">{title}</CardTitle>
              <CardDescription>{description}</CardDescription>
            </div>
          </CardHeader>
          <CardContent>{children}</CardContent>
        </Card>
      </div>
    </main>
  );
}

function RequestResetForm() {
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    const form = new FormData(event.currentTarget);
    try {
      await api.requestPasswordReset(String(form.get("email")));
      setSent(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Không gửi được yêu cầu");
    } finally {
      setSubmitting(false);
    }
  }

  if (sent) {
    return (
      <>
        <p className="text-sm">
          Nếu email tồn tại, chúng tôi đã gửi liên kết đặt lại mật khẩu. Kiểm
          tra hộp thư và làm theo hướng dẫn trong email.
        </p>
        <Link
          to="/login"
          className={buttonVariants({ className: "mt-4 w-full" })}
        >
          Về trang đăng nhập
        </Link>
      </>
    );
  }

  return (
    <form onSubmit={submit}>
      <FieldGroup>
        <Field data-invalid={!!error}>
          <FieldLabel htmlFor="reset-email">Email</FieldLabel>
          <Input
            id="reset-email"
            name="email"
            type="email"
            required
            autoComplete="username"
            placeholder="ten@congty.com"
            aria-invalid={!!error}
          />
        </Field>
        <Field>
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? "Đang gửi..." : "Gửi liên kết đặt lại"}
          </Button>
          <FieldDescription className="pt-1 text-center">
            <Link to="/login">Quay lại đăng nhập</Link>
          </FieldDescription>
        </Field>
      </FieldGroup>
    </form>
  );
}

function ConfirmResetForm({ token }: { token: string }) {
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const form = new FormData(event.currentTarget);
    const password = String(form.get("password"));
    if (password !== String(form.get("confirm_password"))) {
      setError("Mật khẩu nhập lại không khớp.");
      return;
    }
    setSubmitting(true);
    try {
      await api.confirmPasswordReset(token, password);
      setDone(true);
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Không đặt lại được mật khẩu",
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <>
        <p className="text-sm">
          Đã đặt mật khẩu mới. Bạn có thể đăng nhập bằng mật khẩu vừa tạo.
        </p>
        <Link
          to="/login"
          className={buttonVariants({ className: "mt-4 w-full" })}
        >
          Đăng nhập
        </Link>
      </>
    );
  }

  return (
    <form onSubmit={submit}>
      <FieldGroup>
        <Field data-invalid={!!error}>
          <FieldLabel htmlFor="reset-password">Mật khẩu mới</FieldLabel>
          <Input
            id="reset-password"
            name="password"
            type="password"
            required
            minLength={12}
            maxLength={128}
            autoComplete="new-password"
            aria-invalid={!!error}
          />
          <FieldDescription>Tối thiểu 12 ký tự.</FieldDescription>
        </Field>
        <Field data-invalid={!!error}>
          <FieldLabel htmlFor="reset-confirm">Nhập lại mật khẩu</FieldLabel>
          <Input
            id="reset-confirm"
            name="confirm_password"
            type="password"
            required
            minLength={12}
            maxLength={128}
            autoComplete="new-password"
            aria-invalid={!!error}
          />
        </Field>
        <Field>
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? "Đang lưu..." : "Đặt lại mật khẩu"}
          </Button>
        </Field>
      </FieldGroup>
    </form>
  );
}

function ResetPasswordPage() {
  const { token } = Route.useSearch();

  return token ? (
    <ResetShell
      title="Đặt mật khẩu mới"
      description="Liên kết chỉ dùng được một lần và có thời hạn."
    >
      <ConfirmResetForm token={token} />
    </ResetShell>
  ) : (
    <ResetShell
      title="Quên mật khẩu?"
      description="Nhập email tài khoản để nhận liên kết đặt lại mật khẩu."
    >
      <RequestResetForm />
    </ResetShell>
  );
}
