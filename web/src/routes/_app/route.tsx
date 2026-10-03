import { Outlet, createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

import { AppLayoutProvider } from "@/components/app-layout-context";
import { useAppLayout } from "@/components/app-layout-context";
import { AuthProvider, useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
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
} from "@/components/ui/sidebar";
import { FolderKanban, LayoutDashboard, LogOut, Users } from "lucide-react";

export const Route = createFileRoute("/_app")({
  component: AppLayout,
});

function AppLayout() {
  return (
    <AuthProvider>
      <AppLayoutProvider>
        <ProtectedApp />
      </AppLayoutProvider>
    </AuthProvider>
  );
}

function ProtectedApp() {
  const { loading, user, logout } = useAuth();
  const { projects, selectedProjectId, setSelectedProjectId } = useAppLayout();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) void navigate({ to: "/login", replace: true });
  }, [loading, navigate, user]);

  if (loading || !user) {
    return (
      <main className="flex min-h-svh items-center justify-center text-sm text-muted-foreground">
        Đang kiểm tra phiên đăng nhập...
      </main>
    );
  }

  return (
    <SidebarProvider>
      <Sidebar variant="sidebar">
        <SidebarHeader className="h-[60px] shrink-0 border-b">
          <div className="flex items-center gap-2 px-2 py-1.5">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-xs font-bold text-primary-foreground">
              OP
            </div>
            <span className="font-semibold">Open Project</span>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Không gian làm việc</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton isActive>
                    <LayoutDashboard />
                    Tổng quan
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton>
                    <FolderKanban />
                    Dự án
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton>
                    <Users />
                    Đội ngũ
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
          <SidebarGroup>
            <SidebarGroupLabel>Dự án</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {projects.map((project) => (
                  <SidebarMenuItem key={project.id}>
                    <SidebarMenuButton
                      isActive={project.id === selectedProjectId}
                      onClick={() => setSelectedProjectId(project.id)}
                    >
                      <FolderKanban />
                      <span className="truncate">{project.name}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
                {!projects.length && (
                  <p className="px-2 text-xs text-muted-foreground">
                    Chưa có dự án.
                  </p>
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter className="border-t">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton onClick={logout}>
                <LogOut />
                Đăng xuất
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      {/* <SidebarInset className="md:m-0 md:rounded-none md:shadow-none"> */}
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-[60px] shrink-0 items-center gap-3 border-b bg-background px-4">
          <SidebarTrigger />
          <div className="flex-1">
            <p className="text-sm font-semibold">Tổng quan</p>
            <p className="hidden text-xs text-muted-foreground sm:block">
              Không gian làm việc của đội ngũ
            </p>
          </div>
          <div className="hidden text-right sm:block">
            <p className="text-sm font-medium">{user.full_name}</p>
            <p className="text-xs text-muted-foreground">{user.email}</p>
          </div>
          <Button variant="outline" size="sm" onClick={logout}>
            <LogOut />
            <span className="hidden sm:inline">Đăng xuất</span>
          </Button>
        </header>
        <Outlet />
      </SidebarInset>
    </SidebarProvider>
  );
}
