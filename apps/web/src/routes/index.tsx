import { createFileRoute, redirect } from "@tanstack/react-router";
import { getAccessToken } from "../api/client";

export const Route = createFileRoute("/")({
  beforeLoad: () => {
    if (typeof window === "undefined") {
      return;
    }
    throw redirect({ to: getAccessToken() ? "/dashboard" : "/login" });
  },
});
