import { createFileRoute } from "@tanstack/react-router";
import { AdminPage } from "@/features/admin";
import { requireAdmin } from "@/features/auth";

export const Route = createFileRoute("/_authenticated/admin/departments")({
  beforeLoad: requireAdmin,
  component: () => (
    <AdminPage
      kind="departments"
      title="Phòng ban"
      description="Quản lý các phòng ban dùng để tổ chức dự án."
    />
  ),
});
