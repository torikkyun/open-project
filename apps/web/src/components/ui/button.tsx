import { Button as BaseButton } from "@base-ui/react";
import type { ComponentProps } from "react";
import { cn } from "./cn";

export type ButtonVariant =
  | "default"
  | "outline"
  | "ghost"
  | "destructive"
  | "secondary"
  | "link";
export type ButtonSize =
  | "default"
  | "xs"
  | "sm"
  | "lg"
  | "icon"
  | "icon-xs"
  | "icon-sm"
  | "icon-lg";

export const buttonBase =
  "inline-flex cursor-pointer items-center justify-center gap-2 rounded-none border text-button tracking-body transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-focus disabled:cursor-not-allowed disabled:border-hairline disabled:bg-surface-1 disabled:text-ink-subtle";

export const buttonVariants: Record<ButtonVariant, string> = {
  default:
    "border-primary bg-primary text-on-primary enabled:hover:border-blue-hover enabled:hover:bg-blue-hover enabled:active:border-blue-80 enabled:active:bg-blue-80",
  outline:
    "border-primary bg-canvas text-primary enabled:hover:bg-surface-1 enabled:active:bg-surface-2",
  ghost:
    "border-transparent bg-transparent text-primary enabled:hover:bg-surface-1 enabled:active:bg-surface-2",
  destructive:
    "border-error bg-error text-on-error enabled:hover:border-error-hover enabled:hover:bg-error-hover enabled:active:border-error-pressed enabled:active:bg-error-pressed",
  secondary:
    "border-ink bg-ink text-inverse-ink enabled:hover:border-inverse-surface-1 enabled:hover:bg-inverse-surface-1 enabled:active:border-secondary-pressed enabled:active:bg-secondary-pressed",
  link: "border-transparent bg-transparent px-0 py-0 text-primary underline underline-offset-4 enabled:hover:text-blue-hover",
};

export const buttonSizes: Record<ButtonSize, string> = {
  default: "min-h-10 px-4 py-3",
  xs: "min-h-6 px-2 py-1 text-xs",
  sm: "min-h-8 px-3 py-2",
  lg: "min-h-12 px-5 py-4",
  icon: "size-10 p-0",
  "icon-xs": "size-6 p-0",
  "icon-sm": "size-8 p-0",
  "icon-lg": "size-12 p-0",
};

export interface ButtonProps extends ComponentProps<typeof BaseButton> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export function Button({
  variant = "default",
  size = "default",
  className,
  ...props
}: ButtonProps) {
  return (
    <BaseButton
      className={cn(
        buttonBase,
        buttonSizes[size],
        buttonVariants[variant],
        className,
      )}
      {...props}
    />
  );
}
