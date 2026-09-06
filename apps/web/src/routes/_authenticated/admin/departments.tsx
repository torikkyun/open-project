import { createFileRoute } from "@tanstack/react-router";
import { AdminPage } from "@/features/admin";
import { requireAdmin } from "@/features/auth";

export const Route = createFileRoute("/_authenticated/admin/departments")({
  beforeLoad: requireAdmin,
  component: () => (
    <AdminPage
      title="Departments"
      description="Manage departments used for project organization."
    />
  ),
});
