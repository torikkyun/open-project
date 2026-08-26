import { Drawer as BaseDrawer } from "@base-ui/react";
import type { ComponentProps } from "react";
import {
  buttonBase,
  buttonSizes,
  buttonVariants,
  type ButtonSize,
  type ButtonVariant,
} from "./button";
import { cn } from "./cn";

export type DrawerProviderProps = ComponentProps<typeof BaseDrawer.Provider>;
export type DrawerRootProps = ComponentProps<typeof BaseDrawer.Root>;
export type DrawerSwipeAreaProps = ComponentProps<typeof BaseDrawer.SwipeArea>;
export type DrawerPortalProps = ComponentProps<typeof BaseDrawer.Portal>;
export type DrawerBackdropProps = ComponentProps<typeof BaseDrawer.Backdrop>;
export type DrawerViewportProps = ComponentProps<typeof BaseDrawer.Viewport>;
export type DrawerPopupProps = ComponentProps<typeof BaseDrawer.Popup>;
export type DrawerContentProps = ComponentProps<typeof BaseDrawer.Content>;
export type DrawerTitleProps = ComponentProps<typeof BaseDrawer.Title>;
export type DrawerDescriptionProps = ComponentProps<
  typeof BaseDrawer.Description
>;
export type DrawerIndentProps = ComponentProps<typeof BaseDrawer.Indent>;
export type DrawerIndentBackgroundProps = ComponentProps<
  typeof BaseDrawer.IndentBackground
>;
export type DrawerVirtualKeyboardProviderProps = ComponentProps<
  typeof BaseDrawer.VirtualKeyboardProvider
>;

function DrawerProvider(props: DrawerProviderProps) {
  return <BaseDrawer.Provider {...props} />;
}

function DrawerRoot({ swipeDirection = "left", ...props }: DrawerRootProps) {
  return <BaseDrawer.Root swipeDirection={swipeDirection} {...props} />;
}

export interface DrawerTriggerProps extends ComponentProps<
  typeof BaseDrawer.Trigger
> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

function DrawerTrigger({
  variant = "outline",
  size = "default",
  className,
  ...props
}: DrawerTriggerProps) {
  return (
    <BaseDrawer.Trigger
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

function DrawerSwipeArea({ className, ...props }: DrawerSwipeAreaProps) {
  return (
    <BaseDrawer.SwipeArea
      className={cn(
        "fixed inset-y-0 left-0 z-[1498] w-6 touch-none data-[swipe-direction=left]:right-0 data-[swipe-direction=left]:left-auto",
        className,
      )}
      {...props}
    />
  );
}

function DrawerPortal(props: DrawerPortalProps) {
  return <BaseDrawer.Portal {...props} />;
}

function DrawerBackdrop({ className, ...props }: DrawerBackdropProps) {
  return (
    <BaseDrawer.Backdrop
      className={cn(
        "fixed inset-0 z-[1500] min-h-dvh bg-scrim opacity-[calc(1-var(--drawer-swipe-progress))] transition-opacity duration-[450ms] ease-[cubic-bezier(0.32,0.72,0,1)] data-[ending-style]:opacity-0 data-[starting-style]:opacity-0 data-[swiping]:duration-0 supports-[-webkit-touch-callout:none]:absolute",
        className,
      )}
      {...props}
    />
  );
}

function DrawerViewport({ className, ...props }: DrawerViewportProps) {
  return (
    <BaseDrawer.Viewport
      className={cn(
        "pointer-events-none fixed inset-0 z-[1501] overflow-hidden",
        className,
      )}
      {...props}
    />
  );
}

const popupPlacements: Record<"up" | "down" | "left" | "right", string> = {
  left: "inset-y-0 left-0 h-full w-[20rem] max-w-[calc(100vw-3rem)] border-r",
  right: "inset-y-0 right-0 h-full w-[20rem] max-w-[calc(100vw-3rem)] border-l",
  up: "inset-x-0 top-0 max-h-[80dvh] w-full border-b pb-[calc(1.5rem+env(safe-area-inset-top,0px))]",
  down: "inset-x-0 bottom-0 max-h-[80dvh] w-full border-t pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))]",
};

function drawerTransform(state: BaseDrawer.Popup.State) {
  const vertical =
    state.swipeDirection === "up" || state.swipeDirection === "down";
  const movement = vertical
    ? "translateY(calc(var(--drawer-snap-point-offset, 0px) + var(--drawer-swipe-movement-y)))"
    : "translateX(var(--drawer-swipe-movement-x))";

  if (
    state.transitionStatus !== "starting" &&
    state.transitionStatus !== "ending"
  ) {
    return movement;
  }

  const offscreen = {
    left: "translateX(calc(-100% - 2px))",
    right: "translateX(calc(100% + 2px))",
    up: "translateY(calc(-100% - 2px))",
    down: "translateY(calc(100% + 2px))",
  } as const;

  return offscreen[state.swipeDirection];
}

function DrawerPopup({ className, style, ...props }: DrawerPopupProps) {
  return (
    <BaseDrawer.Popup
      className={cn(
        "pointer-events-auto absolute overflow-y-auto overscroll-contain rounded-none border-hairline-strong bg-canvas p-6 text-ink outline-none touch-auto transition-transform duration-[450ms] ease-[cubic-bezier(0.32,0.72,0,1)] will-change-transform data-[swiping]:select-none data-[swiping]:duration-0 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus",
        (state) => popupPlacements[state.swipeDirection],
        className,
      )}
      style={(state) => ({
        transform: drawerTransform(state),
        transitionDuration:
          state.transitionStatus === "ending"
            ? "calc(var(--drawer-swipe-strength) * 400ms)"
            : undefined,
        ...(typeof style === "function" ? style(state) : style),
      })}
      {...props}
    />
  );
}

function DrawerContent({ className, ...props }: DrawerContentProps) {
  return (
    <BaseDrawer.Content
      className={cn("mx-auto w-full max-w-[32rem]", className)}
      {...props}
    />
  );
}

function DrawerTitle({ className, ...props }: DrawerTitleProps) {
  return (
    <BaseDrawer.Title
      className={cn("text-card-title text-ink", className)}
      {...props}
    />
  );
}

function DrawerDescription({ className, ...props }: DrawerDescriptionProps) {
  return (
    <BaseDrawer.Description
      className={cn("mt-1 text-body-sm text-ink-muted", className)}
      {...props}
    />
  );
}

export interface DrawerCloseProps extends ComponentProps<
  typeof BaseDrawer.Close
> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

function CloseIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden="true"
    >
      <path d="M5 5l10 10M15 5 5 15" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function DrawerClose({
  variant,
  size = "default",
  className,
  children,
  ...props
}: DrawerCloseProps) {
  const classes = variant
    ? cn(buttonBase, buttonSizes[size], buttonVariants[variant], className)
    : cn(
        "inline-flex size-12 shrink-0 cursor-pointer items-center justify-center rounded-none border border-transparent bg-transparent p-0 text-ink hover:bg-surface-1 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-focus",
        className,
      );

  return (
    <BaseDrawer.Close
      aria-label={children ? undefined : "Close drawer"}
      className={classes}
      {...props}
    >
      {children ?? (variant ? null : <CloseIcon />)}
    </BaseDrawer.Close>
  );
}

function DrawerIndent({ className, ...props }: DrawerIndentProps) {
  return <BaseDrawer.Indent className={cn("relative", className)} {...props} />;
}

function DrawerIndentBackground({
  className,
  ...props
}: DrawerIndentBackgroundProps) {
  return (
    <BaseDrawer.IndentBackground
      className={cn("absolute inset-0 bg-ink", className)}
      {...props}
    />
  );
}

function DrawerVirtualKeyboardProvider(
  props: DrawerVirtualKeyboardProviderProps,
) {
  return <BaseDrawer.VirtualKeyboardProvider {...props} />;
}

export const Drawer = {
  Provider: DrawerProvider,
  Root: DrawerRoot,
  Trigger: DrawerTrigger,
  SwipeArea: DrawerSwipeArea,
  Portal: DrawerPortal,
  Backdrop: DrawerBackdrop,
  Viewport: DrawerViewport,
  Popup: DrawerPopup,
  Content: DrawerContent,
  Title: DrawerTitle,
  Description: DrawerDescription,
  Close: DrawerClose,
  Indent: DrawerIndent,
  IndentBackground: DrawerIndentBackground,
  VirtualKeyboardProvider: DrawerVirtualKeyboardProvider,
  createHandle: BaseDrawer.createHandle,
};
