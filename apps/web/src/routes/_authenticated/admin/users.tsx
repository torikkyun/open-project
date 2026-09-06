import { createFileRoute } from "@tanstack/react-router";
import { AdminPage } from "@/features/admin";
import { requireAdmin } from "@/features/auth";

export const Route = createFileRoute("/_authenticated/admin/users")({
  beforeLoad: requireAdmin,
  component: () => (
    <AdminPage title="Users" description="Manage users and project access." />
  ),
});
