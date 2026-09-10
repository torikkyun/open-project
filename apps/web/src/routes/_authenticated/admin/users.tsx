import { createFileRoute } from "@tanstack/react-router";
import { AdminPage } from "@/features/admin";
import { requireAdmin } from "@/features/auth";

export const Route = createFileRoute("/_authenticated/admin/users")({
  beforeLoad: requireAdmin,
  component: () => (
    <AdminPage
      kind="users"
      title="Người dùng"
      description="Quản lý người dùng và quyền truy cập dự án."
    />
  ),
});
