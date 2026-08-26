import type { ComponentProps } from "react";
import { cn } from "../ui/cn";

export type Priority = "High" | "Medium" | "Low";

export interface PriorityDotProps extends ComponentProps<"span"> {
  priority: Priority;
}

const priorityClasses: Record<Priority, string> = {
  High: "text-error",
  Medium: "text-ink",
  Low: "text-ink-subtle",
};

const dotClasses: Record<Priority, string> = {
  High: "bg-error",
  Medium: "bg-warning",
  Low: "border border-ink-subtle bg-transparent",
};

export function PriorityDot({
  priority,
  className,
  ...props
}: PriorityDotProps) {
  return (
    <span
      className={cn(
        "inline-flex min-h-6 items-center gap-2 text-body-sm",
        priorityClasses[priority],
        className,
      )}
      {...props}
    >
      <span
        aria-hidden="true"
        className={cn("size-2 shrink-0 rounded-full", dotClasses[priority])}
      />
      {priority}
    </span>
  );
}
