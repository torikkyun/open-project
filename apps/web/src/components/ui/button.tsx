import { Button as BaseButton } from "@base-ui/react";
import type { ComponentProps } from "react";
import { cn } from "./cn";

export type ButtonVariant = "primary" | "secondary" | "tertiary" | "ghost" | "danger";

export const buttonBase =
  "inline-flex cursor-pointer items-center justify-center gap-2 rounded-none border px-4 py-3 text-sm font-normal leading-[1.29] tracking-body transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary disabled:cursor-not-allowed disabled:border-hairline disabled:bg-surface-1 disabled:text-ink-subtle";

export const buttonVariants: Record<ButtonVariant, string> = {
  primary:
    "border-primary bg-primary text-on-primary enabled:hover:border-blue-hover enabled:hover:bg-blue-hover enabled:active:border-blue-80 enabled:active:bg-blue-80",
  secondary:
    "border-ink bg-ink text-inverse-ink enabled:hover:border-inverse-surface-1 enabled:hover:bg-inverse-surface-1 enabled:active:border-black enabled:active:bg-black",
  tertiary:
    "border-primary bg-canvas text-primary enabled:hover:bg-surface-1 enabled:active:bg-surface-2",
  ghost:
    "border-transparent bg-transparent text-primary enabled:hover:bg-surface-1 enabled:active:bg-surface-2",
  danger:
    "border-error bg-error text-on-primary enabled:hover:border-error-hover enabled:hover:bg-error-hover enabled:active:border-[#a2191f] enabled:active:bg-[#a2191f]",
};

export interface ButtonProps extends ComponentProps<typeof BaseButton> {
  variant?: ButtonVariant;
}

export function Button({ variant = "primary", className, ...props }: ButtonProps) {
  return <BaseButton className={cn(buttonBase, buttonVariants[variant], className)} {...props} />;
}
