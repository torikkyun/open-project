import { createFileRoute } from "@tanstack/react-router";
import { AdminPage } from "@/features/admin";
import { requireAdmin } from "@/features/auth";

export const Route = createFileRoute("/_authenticated/admin/templates")({
  beforeLoad: requireAdmin,
  component: () => (
    <AdminPage
      title="Templates"
      description="Manage reusable project task structures."
    />
  ),
});
