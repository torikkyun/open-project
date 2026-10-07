import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowUpRight, Check, Layers3, UsersRound, Workflow } from "lucide-react";

import { LoginForm } from "@/components/login-form";
import { currentUserQueryKey } from "@/components/auth-provider";
import type { User } from "@/api";

export const Route = createFileRoute("/_auth/login/")({
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  function handleAuthenticated(user: User) {
    queryClient.setQueryData(currentUserQueryKey, user);
    void navigate({ to: "/" });
  }

  return (
    <main className="grid min-h-svh bg-muted/20 lg:grid-cols-[minmax(0,1fr)_minmax(420px,520px)] xl:grid-cols-[minmax(0,1fr)_minmax(480px,600px)]">
      <section className="relative hidden flex-col justify-between overflow-hidden bg-primary p-10 text-primary-foreground lg:flex xl:p-14">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-32 -top-40 size-[420px] rounded-full border border-primary-foreground/10"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-12 -top-20 size-[260px] rounded-full border border-primary-foreground/10"
        />
        <div className="relative flex items-center gap-3 text-lg font-semibold">
          <span className="flex size-10 items-center justify-center rounded-xl bg-primary-foreground/10">
            <Layers3 />
          </span>
          Open Project
        </div>
        <div className="relative grid gap-10 xl:grid-cols-[minmax(0,1fr)_minmax(220px,300px)] xl:items-center">
          <div className="max-w-lg">
            <p className="mb-4 text-sm font-medium tracking-wide text-primary-foreground/60">
              KHÔNG GIAN LÀM VIỆC CỦA ĐỘI NGŨ
            </p>
            <h1 className="text-4xl font-semibold leading-tight tracking-tight xl:text-5xl">
              Đưa mọi dự án tiến về phía trước.
            </h1>
            <p className="mt-5 max-w-md leading-7 text-primary-foreground/70">
              Lập kế hoạch, phối hợp cùng đội ngũ và theo dõi công việc trong
              cùng một không gian.
            </p>
          </div>
          <div className="rounded-2xl border border-primary-foreground/15 bg-primary-foreground/5 p-5 backdrop-blur-sm">
            <div className="mb-5 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Workflow />
                Một quy trình rõ ràng
              </div>
              <ArrowUpRight className="text-primary-foreground/50" />
            </div>
            <div className="flex flex-col gap-3">
              {[
                "Lên kế hoạch",
                "Phối hợp cùng đội ngũ",
                "Theo dõi tiến độ",
              ].map((item, index) => (
                <div
                  key={item}
                  className="flex items-center gap-3 rounded-xl border border-primary-foreground/10 bg-primary-foreground/5 px-3 py-3"
                >
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary-foreground/10 text-sm">
                    {index === 1 ? <UsersRound /> : <Check />}
                  </span>
                  <span className="text-sm font-medium">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <p className="relative text-sm text-primary-foreground/50">
          Tập trung vào công việc quan trọng nhất.
        </p>
      </section>

      <section className="flex min-h-svh flex-col justify-center p-5 sm:p-10">
        <div className="mx-auto w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <div className="mb-5 flex items-center gap-3 text-lg font-semibold">
              <span className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                <Layers3 />
              </span>
              Open Project
            </div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Không gian làm việc của đội ngũ
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Đăng nhập để tiếp tục quản lý công việc và dự án.
            </p>
          </div>
          <LoginForm onAuthenticated={handleAuthenticated} />
          <p className="mt-6 text-center text-xs text-muted-foreground">
            Bằng cách tiếp tục, bạn sẽ được đưa đến không gian làm việc của mình.
          </p>
        </div>
      </section>
    </main>
  );
}
