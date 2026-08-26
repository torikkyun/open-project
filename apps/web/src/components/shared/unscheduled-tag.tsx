import type { ComponentProps } from "react";
import { cn } from "../ui/cn";

export type UnscheduledTagProps = ComponentProps<"span">;

export function UnscheduledTag({
  className,
  children = "Unscheduled",
  ...props
}: UnscheduledTagProps) {
  return (
    <span
      className={cn(
        "inline-flex min-h-6 items-center rounded-none bg-surface-2 px-2 text-caption tracking-caption text-ink-muted",
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}
