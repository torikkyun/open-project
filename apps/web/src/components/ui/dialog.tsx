import { Dialog as BaseDialog } from "@base-ui/react";
import type { ComponentProps, ReactNode } from "react";
import { buttonBase, buttonVariants, type ButtonVariant } from "./button";
import { cn } from "./cn";

export type DialogRootProps = ComponentProps<typeof BaseDialog.Root>;

function DialogRoot(props: DialogRootProps) {
  return <BaseDialog.Root {...props} />;
}

export interface DialogTriggerProps extends ComponentProps<typeof BaseDialog.Trigger> {
  variant?: ButtonVariant;
}

function DialogTrigger({ variant = "primary", className, ...props }: DialogTriggerProps) {
  return (
    <BaseDialog.Trigger className={cn(buttonBase, buttonVariants[variant], className)} {...props} />
  );
}

function DialogPortal(props: ComponentProps<typeof BaseDialog.Portal>) {
  return <BaseDialog.Portal {...props} />;
}

function DialogBackdrop(props: ComponentProps<typeof BaseDialog.Backdrop>) {
  return (
    <BaseDialog.Backdrop
      className={cn(
        "fixed inset-0 bg-black/50 opacity-0 transition-opacity duration-150 ease-out data-[open]:opacity-100 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0",
        props.className,
      )}
      {...props}
    />
  );
}

const popupClasses =
  "fixed top-1/2 left-1/2 max-h-[80vh] w-[min(90vw,560px)] -translate-x-1/2 -translate-y-1/2 scale-[0.98] overflow-auto rounded-none border border-hairline bg-canvas p-6 text-ink opacity-0 transition-all duration-150 ease-out data-[open]:scale-100 data-[open]:opacity-100 data-[ending-style]:scale-[0.98] data-[ending-style]:opacity-0 data-[starting-style]:scale-[0.98] data-[starting-style]:opacity-0";

function DialogPopup(props: ComponentProps<typeof BaseDialog.Popup>) {
  return <BaseDialog.Popup className={cn(popupClasses, props.className)} {...props} />;
}

function DialogTitle(props: ComponentProps<typeof BaseDialog.Title>) {
  return (
    <BaseDialog.Title
      className={cn("mb-2 mr-12 text-2xl font-normal leading-[1.33] text-ink", props.className)}
      {...props}
    />
  );
}

function DialogDescription(props: ComponentProps<typeof BaseDialog.Description>) {
  return (
    <BaseDialog.Description
      className={cn("mb-6 text-sm leading-[1.29] tracking-body text-ink-muted", props.className)}
      {...props}
    />
  );
}

export interface DialogCloseProps extends ComponentProps<typeof BaseDialog.Close> {
  variant?: ButtonVariant;
}

function DialogClose({ variant, className, ...props }: DialogCloseProps) {
  const classes = variant
    ? cn(buttonBase, buttonVariants[variant], className)
    : cn(
        "absolute top-3 right-3 inline-flex size-12 cursor-pointer items-center justify-center rounded-none border border-transparent bg-transparent p-0 text-ink hover:bg-surface-1 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary",
        className,
      );

  return <BaseDialog.Close className={classes} {...props} />;
}

export interface DialogContentProps extends ComponentProps<typeof BaseDialog.Popup> {
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
      <BaseDialog.Backdrop className="fixed inset-0 bg-black/50 opacity-0 transition-opacity duration-150 ease-out data-[open]:opacity-100 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0" />
      <BaseDialog.Popup className={cn(popupClasses, className)} {...props}>
        <BaseDialog.Close
          className="absolute top-3 right-3 inline-flex size-12 cursor-pointer items-center justify-center rounded-none border border-transparent bg-transparent p-0 text-ink hover:bg-surface-1 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary"
          aria-label="Close"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path
              d="M5 5l10 10M15 5L5 15"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="square"
            />
          </svg>
        </BaseDialog.Close>
        {heading ? (
          <BaseDialog.Title className="mb-2 mr-12 text-2xl font-normal leading-[1.33] text-ink">
            {heading}
          </BaseDialog.Title>
        ) : null}
        {description ? (
          <BaseDialog.Description className="mb-6 text-sm leading-[1.29] tracking-body text-ink-muted">
            {description}
          </BaseDialog.Description>
        ) : null}
        {children}
      </BaseDialog.Popup>
    </BaseDialog.Portal>
  );
}

export const Dialog = {
  Root: DialogRoot,
  Trigger: DialogTrigger,
  Portal: DialogPortal,
  Backdrop: DialogBackdrop,
  Popup: DialogPopup,
  Title: DialogTitle,
  Description: DialogDescription,
  Close: DialogClose,
  Content: DialogContent,
  createHandle: BaseDialog.createHandle,
};
