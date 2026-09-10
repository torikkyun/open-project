import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import {
  Building2,
  ChevronRight,
  FolderKanban,
  LayoutDashboard,
  LayoutTemplate,
  PanelLeftClose,
  PanelLeftOpen,
  Users,
} from "lucide-react";
import { useState } from "react";
import type { ReactNode } from "react";
import { clearSessionTokens, getSessionUserRole } from "../../api/client";

const navigation = [
  { label: "Tổng quan", to: "/dashboard", icon: LayoutDashboard },
  { label: "Dự án", to: "/projects", icon: FolderKanban },
] as const;

const adminNavigation = [
  { label: "Người dùng", to: "/admin/users", icon: Users },
  { label: "Phòng ban", to: "/admin/departments", icon: Building2 },
  { label: "Mẫu", to: "/admin/templates", icon: LayoutTemplate },
] as const;

const breadcrumbLabels: Record<string, string> = {
  "/dashboard": "Tổng quan",
  "/projects": "Dự án",
  "/admin/users": "Người dùng",
  "/admin/departments": "Phòng ban",
  "/admin/templates": "Mẫu",
};

export function AppShell({ children }: Readonly<{ children?: ReactNode }>) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });
  const isAdmin = getSessionUserRole() === "admin";

  return (
    <div className="min-h-screen bg-surface-1 md:flex">
      <aside
        className={`sticky top-0 border-b border-hairline bg-inverse-canvas text-inverse-ink h-screen overflow-y-auto md:border-b-0 md:border-r ${isCollapsed ? "md:w-16" : "md:w-64"}`}
      >
        <div className="flex min-h-12 items-center justify-between border-b border-inverse-surface-1 px-md md:px-sm">
          <Link
            aria-label="Open Project dashboard"
            className={`overflow-hidden whitespace-nowrap text-subhead font-semibold text-inverse-ink ${isCollapsed ? "md:w-0 md:opacity-0" : "md:w-auto md:opacity-100"}`}
            to="/dashboard"
          >
            Open Project
          </Link>

          <span
            className={`text-caption text-inverse-ink-muted ${isCollapsed ? "md:hidden" : ""}`}
          >
            MVP
          </span>

          <button
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="hidden size-10 shrink-0 cursor-pointer items-center justify-center border border-transparent text-inverse-ink-muted hover:bg-inverse-surface-1 hover:text-inverse-ink focus-visible:outline-2 focus-visible:outline-focus md:inline-flex"
            onClick={() => setIsCollapsed((collapsed) => !collapsed)}
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            type="button"
          >
            {isCollapsed ? (
              <PanelLeftOpen size={18} />
            ) : (
              <PanelLeftClose size={18} />
            )}
          </button>
        </div>
        <nav
          aria-label="Primary navigation"
          className="flex gap-xxs overflow-x-auto p-sm md:block md:p-sm"
        >
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                activeProps={{ className: "bg-primary text-on-primary" }}
                className={`group flex min-h-10 items-center gap-sm border-l-2 border-transparent px-sm py-xs text-body-sm text-inverse-ink-muted hover:bg-inverse-surface-1 hover:text-inverse-ink focus-visible:outline-2 focus-visible:outline-focus ${isCollapsed ? "md:justify-center md:px-0" : ""}`}
                data-active={pathname === item.to}
                key={item.to}
                title={isCollapsed ? item.label : undefined}
                to={item.to}
              >
                <Icon aria-hidden="true" className="shrink-0" size={18} />
                <span className={isCollapsed ? "md:hidden" : ""}>
                  {item.label}
                </span>
                {!isCollapsed && pathname === item.to ? (
                  <ChevronRight
                    aria-hidden="true"
                    className="ml-auto"
                    size={16}
                  />
                ) : null}
              </Link>
            );
          })}
          {isAdmin ? (
            <>
              <p
                className={`hidden px-sm pb-xxs pt-xl text-caption uppercase tracking-caption text-inverse-ink-muted ${isCollapsed ? "md:hidden" : "md:block"}`}
              >
                Quản trị
              </p>
              {adminNavigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    activeProps={{ className: "bg-primary text-on-primary" }}
                    className={`group flex min-h-10 items-center gap-sm border-l-2 border-transparent px-sm py-xs text-body-sm text-inverse-ink-muted hover:bg-inverse-surface-1 hover:text-inverse-ink focus-visible:outline-2 focus-visible:outline-focus ${isCollapsed ? "md:justify-center md:px-0" : ""}`}
                    key={item.to}
                    title={isCollapsed ? item.label : undefined}
                    to={item.to}
                  >
                    <Icon aria-hidden="true" className="shrink-0" size={18} />
                    <span className={isCollapsed ? "md:hidden" : ""}>
                      {item.label}
                    </span>
                    {!isCollapsed && pathname === item.to ? (
                      <ChevronRight
                        aria-hidden="true"
                        className="ml-auto"
                        size={16}
                      />
                    ) : null}
                  </Link>
                );
              })}
            </>
          ) : null}
        </nav>
      </aside>
      <main className="min-w-0 flex-1">
        <header className="sticky top-0 z-20 flex min-h-12 items-center justify-between gap-md border-b border-hairline bg-canvas px-md md:px-xl">
          <nav aria-label="Breadcrumb" className="min-w-0">
            <ol className="flex items-center gap-xs text-body-sm">
              <li>
                <Link
                  className="text-ink-muted hover:text-primary focus-visible:outline-2 focus-visible:outline-focus"
                  to="/dashboard"
                >
                  Không gian làm việc
                </Link>
              </li>
              <li aria-hidden="true" className="text-ink-subtle">
                /
              </li>
              <li
                aria-current="page"
                className="truncate font-semibold text-ink"
              >
                {breadcrumbLabels[pathname] ?? "Không gian dự án"}
              </li>
            </ol>
          </nav>
          <Link
            className="shrink-0 text-body-sm text-primary hover:underline focus-visible:outline-2 focus-visible:outline-focus"
            onClick={() => clearSessionTokens()}
            to="/login"
          >
            Đăng xuất
          </Link>
        </header>
        <div className="mx-auto max-w-[80rem] p-md md:p-xl">
          {children ?? <Outlet />}
        </div>
      </main>
    </div>
  );
}
