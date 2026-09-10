import { createFileRoute } from "@tanstack/react-router";
import { AdminPage } from "@/features/admin";
import { requireAdmin } from "@/features/auth";

export const Route = createFileRoute("/_authenticated/admin/templates")({
  beforeLoad: requireAdmin,
  component: () => (
    <AdminPage
      kind="templates"
      title="Mẫu"
      description="Quản lý các cấu trúc công việc dự án có thể tái sử dụng."
    />
  ),
});
