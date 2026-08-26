import { Dialog as BaseDialog } from "@base-ui/react";
import type { ComponentProps, ReactNode } from "react";
import {
  buttonBase,
  buttonSizes,
  buttonVariants,
  type ButtonSize,
  type ButtonVariant,
} from "./button";
import { cn } from "./cn";

export type DialogRootProps = ComponentProps<typeof BaseDialog.Root>;
export type DialogPortalProps = ComponentProps<typeof BaseDialog.Portal>;
export type DialogBackdropProps = ComponentProps<typeof BaseDialog.Backdrop>;
export type DialogViewportProps = ComponentProps<typeof BaseDialog.Viewport>;
export type DialogPopupProps = ComponentProps<typeof BaseDialog.Popup>;
export type DialogTitleProps = ComponentProps<typeof BaseDialog.Title>;
export type DialogDescriptionProps = ComponentProps<
  typeof BaseDialog.Description
>;

function DialogRoot(props: DialogRootProps) {
  return <BaseDialog.Root {...props} />;
}

export interface DialogTriggerProps extends ComponentProps<
  typeof BaseDialog.Trigger
> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

function DialogTrigger({
  variant = "default",
  size = "default",
  className,
  ...props
}: DialogTriggerProps) {
  return (
    <BaseDialog.Trigger
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

function DialogPortal(props: DialogPortalProps) {
  return <BaseDialog.Portal {...props} />;
}

const backdropClasses =
  "fixed inset-0 z-[1500] min-h-dvh bg-scrim transition-opacity duration-150 ease-out data-[ending-style]:opacity-0 data-[starting-style]:opacity-0 supports-[-webkit-touch-callout:none]:absolute";

function DialogBackdrop({ className, ...props }: DialogBackdropProps) {
  return (
    <BaseDialog.Backdrop
      className={cn(backdropClasses, className)}
      {...props}
    />
  );
}

const viewportClasses =
  "pointer-events-none fixed inset-0 z-[1501] flex items-end justify-center sm:items-center sm:p-6";

function DialogViewport({ className, ...props }: DialogViewportProps) {
  return (
    <BaseDialog.Viewport
      className={cn(viewportClasses, className)}
      {...props}
    />
  );
}

const popupClasses =
  "pointer-events-auto relative max-h-[calc(100dvh-1rem)] w-full translate-y-0 overflow-auto rounded-none border border-hairline bg-canvas p-6 text-ink transition-[transform,opacity] duration-150 ease-out data-[ending-style]:translate-y-4 data-[ending-style]:opacity-0 data-[starting-style]:translate-y-4 data-[starting-style]:opacity-0 sm:max-h-[80vh] sm:max-w-[35rem]";

function DialogPopup({ className, ...props }: DialogPopupProps) {
  return (
    <BaseDialog.Popup className={cn(popupClasses, className)} {...props} />
  );
}

function DialogTitle({ className, ...props }: DialogTitleProps) {
  return (
    <BaseDialog.Title
      className={cn("mb-2 mr-12 text-card-title text-ink", className)}
      {...props}
    />
  );
}

function DialogDescription({ className, ...props }: DialogDescriptionProps) {
  return (
    <BaseDialog.Description
      className={cn(
        "mb-6 text-body-sm tracking-body text-ink-muted",
        className,
      )}
      {...props}
    />
  );
}

export interface DialogCloseProps extends ComponentProps<
  typeof BaseDialog.Close
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
      <path
        d="M5 5l10 10M15 5 5 15"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="square"
      />
    </svg>
  );
}

function DialogClose({
  variant,
  size = "default",
  className,
  children,
  ...props
}: DialogCloseProps) {
  const classes = variant
    ? cn(buttonBase, buttonSizes[size], buttonVariants[variant], className)
    : cn(
        "absolute top-3 right-3 inline-flex size-12 cursor-pointer items-center justify-center rounded-none border border-transparent bg-transparent p-0 text-ink hover:bg-surface-1 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-focus",
        className,
      );

  return (
    <BaseDialog.Close className={classes} {...props}>
      {children ?? (variant ? null : <CloseIcon />)}
    </BaseDialog.Close>
  );
}

export interface DialogContentProps extends ComponentProps<
  typeof BaseDialog.Popup
> {
  heading?: ReactNode;
  description?: ReactNode;
}

/**
 * Convenience composition: portal + backdrop + popup with heading, description and close button.
 */
function DialogContent({
  heading,
  description,
  children,
  className,
  ...props
}: DialogContentProps) {
  return (
    <BaseDialog.Portal>
      <BaseDialog.Backdrop className={backdropClasses} />
      <BaseDialog.Viewport className={viewportClasses}>
        <BaseDialog.Popup className={cn(popupClasses, className)} {...props}>
          <BaseDialog.Close
            className="absolute top-3 right-3 inline-flex size-12 cursor-pointer items-center justify-center rounded-none border border-transparent bg-transparent p-0 text-ink hover:bg-surface-1 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-focus"
            aria-label="Close"
          >
            <CloseIcon />
          </BaseDialog.Close>
          {heading ? (
            <BaseDialog.Title className="mb-2 mr-12 text-card-title text-ink">
              {heading}
            </BaseDialog.Title>
          ) : null}
          {description ? (
            <BaseDialog.Description className="mb-6 text-body-sm tracking-body text-ink-muted">
              {description}
            </BaseDialog.Description>
          ) : null}
          {children}
        </BaseDialog.Popup>
      </BaseDialog.Viewport>
    </BaseDialog.Portal>
  );
}

export const Dialog = {
  Root: DialogRoot,
  Trigger: DialogTrigger,
  Portal: DialogPortal,
  Backdrop: DialogBackdrop,
  Viewport: DialogViewport,
  Popup: DialogPopup,
  Title: DialogTitle,
  Description: DialogDescription,
  Close: DialogClose,
  Content: DialogContent,
  createHandle: BaseDialog.createHandle,
};
