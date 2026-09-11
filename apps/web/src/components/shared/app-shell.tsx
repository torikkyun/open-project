import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import {
  Building2,
  FolderKanban,
  LayoutDashboard,
  LayoutTemplate,
  Users,
} from "lucide-react";
import type { ReactNode } from "react";
import { clearSessionTokens, getSessionUserRole } from "../../api/client";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  Button,
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "../ui";

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
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });
  const isAdmin = getSessionUserRole() === "admin";

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon">
        <SidebarHeader className="h-14 justify-center border-b">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                render={<Link to="/dashboard" />}
                size="lg"
                tooltip="Open Project"
                aria-label="Open Project dashboard"
              >
                <span
                  aria-hidden="true"
                  className="flex size-7 shrink-0 items-center justify-center rounded-md bg-primary text-xs font-bold text-primary-foreground"
                >
                  OP
                </span>
                <span className="truncate font-semibold">Open Project</span>
                <span className="ml-auto shrink-0 text-xs text-muted-foreground">
                  MVP
                </span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu className="gap-2">
                {navigation.map((item) => {
                  const Icon = item.icon;
                  return (
                    <SidebarMenuItem key={item.to}>
                      <SidebarMenuButton
                        render={<Link to={item.to} />}
                        isActive={pathname === item.to}
                        tooltip={item.label}
                      >
                        <Icon aria-hidden="true" />
                        <span>{item.label}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
          {isAdmin ? (
            <SidebarGroup>
              <SidebarGroupLabel>Quản trị</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu className="gap-2">
                  {adminNavigation.map((item) => {
                    const Icon = item.icon;
                    return (
                      <SidebarMenuItem key={item.to}>
                        <SidebarMenuButton
                          render={<Link to={item.to} />}
                          isActive={pathname === item.to}
                          tooltip={item.label}
                        >
                          <Icon aria-hidden="true" />
                          <span>{item.label}</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          ) : null}
        </SidebarContent>
      </Sidebar>
      <SidebarInset>
        <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b bg-background/95 px-4 backdrop-blur md:px-6">
          <SidebarTrigger className="-ml-1" />
          <Breadcrumb className="min-w-0 flex-1">
            <BreadcrumbList className="flex-nowrap">
              <BreadcrumbItem className="hidden sm:inline-flex">
                <BreadcrumbLink render={<Link to="/dashboard" />}>
                  Không gian làm việc
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden sm:inline-flex" />
              <BreadcrumbItem className="min-w-0">
                <BreadcrumbPage className="truncate font-medium">
                  {breadcrumbLabels[pathname] ?? "Không gian dự án"}
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <Button
            render={<Link to="/login" />}
            size="sm"
            variant="ghost"
            onClick={() => clearSessionTokens()}
          >
            Đăng xuất
          </Button>
        </header>
        <div className="mx-auto w-full max-w-7xl flex-1 p-4 md:p-6">
          {children ?? <Outlet />}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
