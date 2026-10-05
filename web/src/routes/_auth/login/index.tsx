import { createFileRoute, useNavigate } from "@tanstack/react-router";

import { LoginForm } from "@/components/login-form";
import type { User } from "@/api";

export const Route = createFileRoute("/_auth/login/")({
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();

  function handleAuthenticated(_user: User) {
    void navigate({ to: "/" });
  }

  return (
    <main className="grid min-h-svh lg:grid-cols-[minmax(0,1fr)_minmax(420px,520px)]">
      <section className="hidden flex-col justify-between bg-primary p-10 text-primary-foreground lg:flex">
        <div className="flex items-center gap-3 text-lg font-semibold">
          <span className="flex size-9 items-center justify-center rounded-xl bg-primary-foreground/10">
            OP
          </span>
          Open Project
        </div>
        <div className="max-w-lg space-y-4">
          <p className="text-sm font-medium text-primary-foreground/60">
            QUẢN LÝ CÔNG VIỆC
          </p>
          <h1 className="text-4xl font-semibold tracking-tight">
            Lập kế hoạch. Đồng bộ đội ngũ. Hoàn thành công việc tự tin.
          </h1>
          <p className="text-primary-foreground/70">
            Quản lý dự án, công việc và cập nhật đội ngũ trong một không gian
            tập trung.
          </p>
        </div>
        <p className="text-sm text-primary-foreground/50">
          Dành cho những đội ngũ luôn thúc đẩy công việc tiến lên.
        </p>
      </section>
      <section className="flex items-center justify-center bg-background p-6 sm:p-10">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <p className="text-lg font-semibold">Open Project</p>
            <p className="text-sm text-muted-foreground">
              Không gian làm việc của đội ngũ
            </p>
          </div>
          <LoginForm onAuthenticated={handleAuthenticated} />
        </div>
      </section>
    </main>
  );
}
