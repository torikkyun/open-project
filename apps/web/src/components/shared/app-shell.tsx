import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { clearSessionTokens, getSessionUserRole } from "../../api/client";

const navigation = [
  { label: "Dashboard", to: "/dashboard" },
  { label: "Projects", to: "/projects" },
] as const;

const adminNavigation = [
  { label: "Users", to: "/admin/users" },
  { label: "Departments", to: "/admin/departments" },
  { label: "Templates", to: "/admin/templates" },
] as const;

export function AppShell({ children }: Readonly<{ children?: ReactNode }>) {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });
  const isAdmin = getSessionUserRole() === "admin";

  return (
    <div className="min-h-screen bg-surface-1 md:flex">
      <aside className="border-b border-hairline bg-inverse-canvas text-inverse-ink md:min-h-screen md:w-64 md:border-b-0 md:border-r">
        <div className="flex items-center justify-between px-lg py-md md:block md:px-xl md:py-xl">
          <Link className="text-subhead font-semibold" to="/dashboard">
            Open Project
          </Link>
          <span className="text-caption text-inverse-ink-muted">MVP</span>
        </div>
        <nav
          aria-label="Primary navigation"
          className="flex gap-xs overflow-x-auto px-md pb-md md:block md:px-md"
        >
          {navigation.map((item) => (
            <Link
              activeProps={{ className: "bg-primary text-on-primary" }}
              className="block whitespace-nowrap px-sm py-xs text-body-sm text-inverse-ink-muted hover:bg-inverse-surface-1 hover:text-inverse-ink"
              data-active={pathname === item.to}
              key={item.to}
              to={item.to}
            >
              {item.label}
            </Link>
          ))}
          {isAdmin ? (
            <>
              <p className="hidden px-sm pb-xxs pt-xl text-caption uppercase text-inverse-ink-muted md:block">
                Administration
              </p>
              {adminNavigation.map((item) => (
                <Link
                  activeProps={{ className: "bg-primary text-on-primary" }}
                  className="block whitespace-nowrap px-sm py-xs text-body-sm text-inverse-ink-muted hover:bg-inverse-surface-1 hover:text-inverse-ink"
                  key={item.to}
                  to={item.to}
                >
                  {item.label}
                </Link>
              ))}
            </>
          ) : null}
        </nav>
      </aside>
      <main className="min-w-0 flex-1">
        <header className="flex items-center justify-between border-b border-hairline bg-canvas px-md py-sm md:px-xl">
          <span className="text-body-sm text-ink-muted">Project workspace</span>
          <Link
            className="text-body-sm text-primary hover:underline"
            onClick={() => clearSessionTokens()}
            to="/login"
          >
            Sign out
          </Link>
        </header>
        <div className="mx-auto max-w-[80rem] p-md md:p-xl">
          {children ?? <Outlet />}
        </div>
      </main>
    </div>
  );
}
