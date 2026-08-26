import type { ComponentProps } from "react";
import { cn } from "../ui/cn";

export type StatusTagStatus =
  | "Active"
  | "Done"
  | "Paused"
  | "To Do"
  | "In Progress"
  | "Review"
  | "Pending";

export interface StatusTagProps extends ComponentProps<"span"> {
  status: StatusTagStatus;
}

const statusClasses: Record<StatusTagStatus, string> = {
  Active: "border-primary text-primary",
  Done: "border-success text-success",
  Paused: "border-hairline bg-surface-2 text-ink-muted",
  "To Do": "border-hairline-strong text-ink",
  "In Progress": "border-primary bg-primary text-on-primary",
  Review: "border-hairline-strong bg-ink text-inverse-ink",
  Pending: "border-hairline bg-surface-1 text-ink-muted",
};

export function StatusTag({ status, className, ...props }: StatusTagProps) {
  return (
    <span
      className={cn(
        "inline-flex min-h-6 items-center rounded-none border px-2 text-caption tracking-caption",
        statusClasses[status],
        className,
      )}
      {...props}
    >
      {status}
    </span>
  );
}
