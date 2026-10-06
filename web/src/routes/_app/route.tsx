import {
  Outlet,
  createFileRoute,
  useNavigate,
  useRouterState,
} from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api, assetUrl, type Project, type User } from "@/api";
import { AuthProvider, useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Bell,
  ChevronsUpDown,
  FolderKanban,
  LogOut,
  Plus,
  UserRound,
  Users,
} from "lucide-react";

export const Route = createFileRoute("/_app")({
  component: AppLayout,
});

function AppLayout() {
  return (
    <AuthProvider>
      <ProtectedApp />
    </AuthProvider>
  );
}

function AccountMenu({
  user,
  logout,
  onAccountClick,
  onAvatarUpload,
}: {
  user: User;
  logout: () => void;
  onAccountClick: () => void;
  onAvatarUpload: (file: File) => void;
  avatarUploading: boolean;
}) {
  const { isMobile } = useSidebar();
  const avatarInputRef = useRef<HTMLInputElement>(null);

  return (
    <>
      <input
        ref={avatarInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) onAvatarUpload(file);
          event.target.value = "";
        }}
      />
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <SidebarMenuButton
              size="lg"
              tooltip="Tài khoản"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            />
          }
        >
          <Avatar size="sm">
            {user.avatar_url && (
              <AvatarImage src={assetUrl(user.avatar_url)} alt="" />
            )}
            <AvatarFallback>
              {user.full_name.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <span className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-medium">{user.full_name}</span>
            <span className="truncate text-xs">{user.email}</span>
          </span>
          <ChevronsUpDown className="ml-auto size-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent
          side={isMobile ? "top" : "right"}
          align="start"
          className="w-56"
        >
          <DropdownMenuGroup>
            <DropdownMenuLabel className="font-normal">
              <div className="flex items-center gap-2">
                <Avatar size="sm">
                  {user.avatar_url && (
                    <AvatarImage src={assetUrl(user.avatar_url)} alt="" />
                  )}
                  <AvatarFallback>
                    {user.full_name.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="grid text-left text-sm">
                  <span className="truncate font-medium">{user.full_name}</span>
                  <span className="truncate text-xs">{user.email}</span>
                </div>
              </div>
            </DropdownMenuLabel>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          {/* <DropdownMenuItem
            onClick={() => avatarInputRef.current?.click()}
            disabled={avatarUploading}
          >
            <Settings />
            Đổi ảnh đại diện
          </DropdownMenuItem> */}
          <DropdownMenuItem onClick={onAccountClick}>
            <UserRound />
            Tài khoản
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Bell />
            Thông báo
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={logout}>
            <LogOut />
            Đăng xuất
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}

function ProtectedApp() {
  const { loading, user, logout } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });
  const queryClient = useQueryClient();
  const projectsQuery = useQuery({
    queryKey: ["projects"],
    queryFn: api.listProjects,
    enabled: !!user,
  });
  const [createProjectOpen, setCreateProjectOpen] = useState(false);
  const avatarMutation = useMutation({
    mutationFn: api.updateAvatar,
    onSuccess: (nextUser) => {
      queryClient.setQueryData(["auth", "currentUser"], nextUser);
    },
  });
  const createProjectMutation = useMutation({
    mutationFn: api.createProject,
    onSuccess: (project) => {
      queryClient.setQueryData<Project[]>(["projects"], (projects) => [
        project,
        ...(projects ?? []),
      ]);
      setCreateProjectOpen(false);
      void navigate({
        to: "/projects/$projectId",
        params: { projectId: project.id },
      });
    },
  });

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

  const projects = projectsQuery.data ?? [];

  return (
    <SidebarProvider>
      <Sidebar variant="floating" collapsible="icon">
        <SidebarHeader className="h-[51px] shrink-0 border-b p-0">
          <div className="flex h-full items-center gap-2 px-2 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-xs font-bold text-primary-foreground">
              OP
            </div>
            <span className="truncate font-semibold group-data-[collapsible=icon]:hidden">
              Open Project
            </span>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Không gian làm việc</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    isActive={pathname === "/"}
                    tooltip="Tổng quan"
                    onClick={() => void navigate({ to: "/" })}
                  >
                    <FolderKanban />
                    Tổng quan
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
          {user.role === "admin" && (
            <SidebarGroup>
              <SidebarGroupLabel>Quản trị</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      tooltip="Quản lý tài khoản"
                      isActive={pathname === "/admin/users"}
                      onClick={() => void navigate({ to: "/admin/users" })}
                    >
                      <Users />
                      Quản lý tài khoản
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          )}
          <SidebarGroup>
            <SidebarGroupLabel>Dự án</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    tooltip="Tạo dự án"
                    onClick={() => setCreateProjectOpen(true)}
                  >
                    <Plus />
                    Tạo dự án
                  </SidebarMenuButton>
                </SidebarMenuItem>
                {projects.map((project) => (
                  <SidebarMenuItem key={project.id}>
                    <SidebarMenuButton
                      tooltip={project.name}
                      isActive={pathname === `/projects/${project.id}`}
                      onClick={() =>
                        void navigate({
                          to: "/projects/$projectId",
                          params: { projectId: project.id },
                        })
                      }
                    >
                      <FolderKanban />
                      <span className="truncate">{project.name}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
                {projectsQuery.isPending && (
                  <p className="px-2 text-xs text-muted-foreground">
                    Đang tải dự án...
                  </p>
                )}
                {projectsQuery.error && (
                  <p role="alert" className="px-2 text-xs text-destructive">
                    Không thể tải danh sách dự án.
                  </p>
                )}
                {!projectsQuery.isPending &&
                  !projectsQuery.error &&
                  !projects.length && (
                    <p className="px-2 text-xs text-muted-foreground">
                      Chưa có dự án.
                    </p>
                  )}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter className="border-t">
          <AccountMenu
            user={user}
            logout={logout}
            onAccountClick={() => void navigate({ to: "/account" })}
            onAvatarUpload={(file) => avatarMutation.mutate(file)}
            avatarUploading={avatarMutation.isPending}
          />
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-[60px] shrink-0 items-center gap-3 border-b bg-background px-4">
          <SidebarTrigger />
          <div className="flex-1">
            <p className="text-sm font-semibold">Open Project</p>
            <p className="hidden text-xs text-muted-foreground sm:block">
              Không gian làm việc của đội ngũ
            </p>
          </div>
          {/* <div className="hidden text-right sm:block">
            <p className="text-sm font-medium">{user.full_name}</p>
            <p className="text-xs text-muted-foreground">{user.email}</p>
          </div>
          <Button variant="outline" size="sm" onClick={logout}>
            <LogOut />
            <span className="hidden sm:inline">Đăng xuất</span>
          </Button> */}
        </header>
        {projectsQuery.error && (
          <p role="alert" className="mx-4 mt-4 text-sm text-destructive">
            Không thể tải danh sách dự án. Hãy thử tải lại trang.
          </p>
        )}
        <Outlet />
      </SidebarInset>
      <Dialog
        open={createProjectOpen}
        onOpenChange={(open) => {
          setCreateProjectOpen(open);
          if (!open) createProjectMutation.reset();
        }}
      >
        <DialogContent>
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              const form = event.currentTarget;
              const data = new FormData(event.currentTarget);
              createProjectMutation.mutate(
                {
                  name: String(data.get("name")),
                  project_key: String(data.get("project_key")).trim(),
                  description:
                    String(data.get("description") ?? "").trim() || null,
                },
                {
                  onSuccess: () => form.reset(),
                },
              );
            }}
          >
            <DialogHeader>
              <DialogTitle>Tạo dự án</DialogTitle>
              <DialogDescription>
                Nhập tên, mã và mô tả cho dự án mới.
              </DialogDescription>
            </DialogHeader>
            <Input
              name="name"
              placeholder="Tên dự án"
              required
              maxLength={160}
              aria-label="Tên dự án"
            />
            <Input
              name="project_key"
              placeholder="Mã dự án (ví dụ: SAM)"
              required
              minLength={2}
              maxLength={10}
              pattern="[A-Za-z][A-Za-z0-9]*"
              aria-label="Mã dự án"
            />
            <Input
              name="description"
              placeholder="Mô tả (không bắt buộc)"
              aria-label="Mô tả dự án"
            />
            {createProjectMutation.error && (
              <p role="alert" className="text-sm text-destructive">
                {createProjectMutation.error.message}
              </p>
            )}
            <DialogFooter>
              <Button type="submit" disabled={createProjectMutation.isPending}>
                Tạo dự án
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
}
