import { Switch as BaseSwitch } from "@base-ui/react";
import type { ComponentProps } from "react";
import { cn } from "./cn";

export type SwitchRootProps = ComponentProps<typeof BaseSwitch.Root>;
export type SwitchThumbProps = ComponentProps<typeof BaseSwitch.Thumb>;

function SwitchRoot({ className, ...props }: SwitchRootProps) {
  return (
    <BaseSwitch.Root
      className={cn(
        "inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-none border border-hairline-strong bg-canvas p-[3px] transition-colors duration-150 data-[checked]:border-primary data-[checked]:bg-primary data-[disabled]:cursor-not-allowed data-[disabled]:border-hairline data-[disabled]:bg-surface-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus",
        className,
      )}
      {...props}
    />
  );
}

function SwitchThumb({ className, ...props }: SwitchThumbProps) {
  return (
    <BaseSwitch.Thumb
      className={cn(
        "size-4 bg-ink transition-[translate,background-color] duration-150 data-[checked]:translate-x-5 data-[checked]:bg-on-primary data-[disabled]:bg-ink-subtle",
        className,
      )}
      {...props}
    />
  );
}

export const Switch = {
  Root: SwitchRoot,
  Thumb: SwitchThumb,
};
