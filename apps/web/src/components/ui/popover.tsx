import { Popover as BasePopover } from "@base-ui/react";
import type { ComponentProps } from "react";
import {
  buttonBase,
  buttonSizes,
  buttonVariants,
  type ButtonSize,
  type ButtonVariant,
} from "./button";
import { cn } from "./cn";

export type PopoverRootProps = ComponentProps<typeof BasePopover.Root>;
export type PopoverPortalProps = ComponentProps<typeof BasePopover.Portal>;
export type PopoverBackdropProps = ComponentProps<typeof BasePopover.Backdrop>;
export type PopoverPositionerProps = ComponentProps<
  typeof BasePopover.Positioner
>;
export type PopoverPopupProps = ComponentProps<typeof BasePopover.Popup>;
export type PopoverArrowProps = ComponentProps<typeof BasePopover.Arrow>;
export type PopoverViewportProps = ComponentProps<typeof BasePopover.Viewport>;
export type PopoverTitleProps = ComponentProps<typeof BasePopover.Title>;
export type PopoverDescriptionProps = ComponentProps<
  typeof BasePopover.Description
>;
export type PopoverCloseProps = ComponentProps<typeof BasePopover.Close>;

function PopoverRoot(props: PopoverRootProps) {
  return <BasePopover.Root {...props} />;
}

export interface PopoverTriggerProps extends ComponentProps<
  typeof BasePopover.Trigger
> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

function PopoverTrigger({
  variant = "outline",
  size = "default",
  className,
  ...props
}: PopoverTriggerProps) {
  return (
    <BasePopover.Trigger
      className={cn(
        buttonBase,
        buttonSizes[size],
        buttonVariants[variant],
        "data-[popup-open]:bg-surface-1",
        className,
      )}
      {...props}
    />
  );
}

function PopoverPortal(props: PopoverPortalProps) {
  return <BasePopover.Portal {...props} />;
}

function PopoverBackdrop({ className, ...props }: PopoverBackdropProps) {
  return (
    <BasePopover.Backdrop
      className={cn("fixed inset-0 z-[1399]", className)}
      {...props}
    />
  );
}

function PopoverPositioner({
  className,
  sideOffset = 8,
  collisionPadding = 8,
  ...props
}: PopoverPositionerProps) {
  return (
    <BasePopover.Positioner
      className={cn("z-[1400] max-w-[var(--available-width)]", className)}
      sideOffset={sideOffset}
      collisionPadding={collisionPadding}
      {...props}
    />
  );
}

function PopoverPopup({ className, ...props }: PopoverPopupProps) {
  return (
    <BasePopover.Popup
      className={cn(
        "relative flex w-[20rem] max-w-[calc(100vw-2rem)] max-h-[var(--available-height)] origin-[var(--transform-origin)] flex-col overflow-auto rounded-none border border-hairline-strong bg-canvas p-4 text-ink outline-none transition-[scale,opacity] duration-150 ease-out data-[ending-style]:scale-[0.98] data-[ending-style]:opacity-0 data-[starting-style]:scale-[0.98] data-[starting-style]:opacity-0 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-focus",
        className,
      )}
      {...props}
    />
  );
}

function PopoverArrow({ className, ...props }: PopoverArrowProps) {
  return (
    <BasePopover.Arrow
      className={cn(
        "relative block size-2 rotate-45 border-l border-t border-hairline-strong bg-canvas data-[side=bottom]:-top-1 data-[side=left]:-right-1 data-[side=right]:-left-1 data-[side=top]:-bottom-1",
        className,
      )}
      {...props}
    />
  );
}

function PopoverViewport({ className, ...props }: PopoverViewportProps) {
  return (
    <BasePopover.Viewport
      className={cn("relative h-full w-full overflow-clip", className)}
      {...props}
    />
  );
}

function PopoverTitle({ className, ...props }: PopoverTitleProps) {
  return (
    <BasePopover.Title
      className={cn("text-card-title text-ink", className)}
      {...props}
    />
  );
}

function PopoverDescription({ className, ...props }: PopoverDescriptionProps) {
  return (
    <BasePopover.Description
      className={cn("mt-1 text-body-sm text-ink-muted", className)}
      {...props}
    />
  );
}

function PopoverClose({ className, children, ...props }: PopoverCloseProps) {
  return (
    <BasePopover.Close
      className={cn(
        "inline-flex min-h-10 cursor-pointer items-center justify-center rounded-none border border-transparent px-3 text-button text-primary hover:bg-surface-1 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-focus",
        className,
      )}
      {...props}
    >
      {children ?? "Close"}
    </BasePopover.Close>
  );
}

export const Popover = {
  Root: PopoverRoot,
  Trigger: PopoverTrigger,
  Portal: PopoverPortal,
  Backdrop: PopoverBackdrop,
  Positioner: PopoverPositioner,
  Popup: PopoverPopup,
  Arrow: PopoverArrow,
  Viewport: PopoverViewport,
  Title: PopoverTitle,
  Description: PopoverDescription,
  Close: PopoverClose,
  createHandle: BasePopover.createHandle,
};
