import { createFileRoute, redirect } from "@tanstack/react-router";
import { getAccessToken } from "../api/client";

export const Route = createFileRoute("/")({
  beforeLoad: () => {
    throw redirect({ to: getAccessToken() ? "/dashboard" : "/login" });
  },
});
