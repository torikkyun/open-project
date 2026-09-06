import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { getAccessToken } from "../../api/client";
import { AppShell } from "../../components/shared/app-shell";

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: ({ location }) => {
    if (!getAccessToken()) {
      throw redirect({ to: "/login" });
    }
    return { requestedPath: location.pathname };
  },
  component: () => (
    <AppShell>
      <Outlet />
    </AppShell>
  ),
});
