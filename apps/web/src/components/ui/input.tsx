import { Input as BaseInput } from "@base-ui/react";
import type { ComponentProps } from "react";
import { cn } from "./cn";

export type InputProps = ComponentProps<typeof BaseInput>;

const inputClasses =
  "min-h-12 w-full rounded-none border-0 border-b border-hairline-strong bg-surface-1 px-4 py-[11px] text-base leading-[1.5] tracking-body text-ink transition-colors placeholder:text-ink-subtle enabled:hover:bg-surface-2 focus:border-b-2 focus:border-primary focus:outline-none data-[invalid]:border-b-2 data-[invalid]:border-error disabled:cursor-not-allowed disabled:border-hairline disabled:bg-surface-2 disabled:text-ink-subtle";

function Input({ className, ...props }: InputProps) {
  return <BaseInput className={cn(inputClasses, className)} {...props} />;
}

export { Input };
