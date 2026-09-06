import { TaskDetailPage } from "@/features/tasks";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/tasks/$taskId")({
  component: TaskDetailPage,
});
