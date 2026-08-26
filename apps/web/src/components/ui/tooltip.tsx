import { Tooltip as BaseTooltip } from "@base-ui/react";
import type { ComponentProps } from "react";
import { cn } from "./cn";

export type TooltipProviderProps = ComponentProps<typeof BaseTooltip.Provider>;
export type TooltipRootProps = ComponentProps<typeof BaseTooltip.Root>;
export type TooltipTriggerProps = ComponentProps<typeof BaseTooltip.Trigger>;
export type TooltipPortalProps = ComponentProps<typeof BaseTooltip.Portal>;
export type TooltipPositionerProps = ComponentProps<
  typeof BaseTooltip.Positioner
>;
export type TooltipPopupProps = ComponentProps<typeof BaseTooltip.Popup>;
export type TooltipArrowProps = ComponentProps<typeof BaseTooltip.Arrow>;
export type TooltipViewportProps = ComponentProps<typeof BaseTooltip.Viewport>;

function TooltipRoot(props: TooltipRootProps) {
  return <BaseTooltip.Root {...props} />;
}

function TooltipTrigger({ className, ...props }: TooltipTriggerProps) {
  return (
    <BaseTooltip.Trigger className={cn("inline-flex", className)} {...props} />
  );
}

function TooltipPortal(props: TooltipPortalProps) {
  return <BaseTooltip.Portal {...props} />;
}

function TooltipPositioner({
  className,
  sideOffset = 8,
  collisionPadding = 8,
  ...props
}: TooltipPositionerProps) {
  return (
    <BaseTooltip.Positioner
      className={cn("z-[1400] max-w-[var(--available-width)]", className)}
      sideOffset={sideOffset}
      collisionPadding={collisionPadding}
      {...props}
    />
  );
}

function TooltipPopup({ className, ...props }: TooltipPopupProps) {
  return (
    <BaseTooltip.Popup
      className={cn(
        "relative max-w-[min(18rem,var(--available-width))] origin-[var(--transform-origin)] rounded-none bg-inverse-canvas px-3 py-2 text-xs leading-[1.33] tracking-caption text-inverse-ink transition-[scale,opacity] duration-150 ease-out data-[ending-style]:scale-[0.98] data-[ending-style]:opacity-0 data-[instant]:transition-none data-[starting-style]:scale-[0.98] data-[starting-style]:opacity-0",
        className,
      )}
      {...props}
    />
  );
}

function TooltipArrow({ className, ...props }: TooltipArrowProps) {
  return (
    <BaseTooltip.Arrow
      className={cn(
        "relative block size-2 rotate-45 bg-inverse-canvas data-[side=bottom]:-top-1 data-[side=left]:-right-1 data-[side=right]:-left-1 data-[side=top]:-bottom-1",
        className,
      )}
      {...props}
    />
  );
}

function TooltipViewport({ className, ...props }: TooltipViewportProps) {
  return (
    <BaseTooltip.Viewport
      className={cn("relative h-full w-full overflow-clip", className)}
      {...props}
    />
  );
}

function TooltipProvider({
  delay = 500,
  closeDelay = 100,
  ...props
}: TooltipProviderProps) {
  return (
    <BaseTooltip.Provider delay={delay} closeDelay={closeDelay} {...props} />
  );
}

export const Tooltip = {
  Root: TooltipRoot,
  Trigger: TooltipTrigger,
  Portal: TooltipPortal,
  Positioner: TooltipPositioner,
  Popup: TooltipPopup,
  Arrow: TooltipArrow,
  Viewport: TooltipViewport,
  Provider: TooltipProvider,
  createHandle: BaseTooltip.createHandle,
};
