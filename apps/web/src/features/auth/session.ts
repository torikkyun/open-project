import { redirect } from "@tanstack/react-router";
import { getSessionUserRole } from "../../api/client";

export function requireAdmin() {
  if (getSessionUserRole() !== "admin") {
    throw redirect({ to: "/dashboard" });
  }
}
