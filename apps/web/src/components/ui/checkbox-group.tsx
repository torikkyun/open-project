import { CheckboxGroup as BaseCheckboxGroup } from "@base-ui/react";
import type { ComponentProps } from "react";
import { cn } from "./cn";

export type CheckboxGroupProps = ComponentProps<typeof BaseCheckboxGroup>;

export function CheckboxGroup({ className, ...props }: CheckboxGroupProps) {
  return (
    <BaseCheckboxGroup
      className={cn(
        "flex flex-col items-stretch gap-1 text-ink data-[disabled]:text-ink-subtle",
        className,
      )}
      {...props}
    />
  );
}
