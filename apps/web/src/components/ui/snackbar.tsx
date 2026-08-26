import { Toast as BaseToast } from "@base-ui/react";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "./cn";

export type SnackbarToast = BaseToast.Root.ToastObject;
export type SnackbarProviderProps = ComponentProps<typeof BaseToast.Provider>;
export type SnackbarPortalProps = ComponentProps<typeof BaseToast.Portal>;
export type SnackbarViewportProps = ComponentProps<typeof BaseToast.Viewport>;
export type SnackbarRootProps = ComponentProps<typeof BaseToast.Root>;
export type SnackbarContentProps = ComponentProps<typeof BaseToast.Content>;
export type SnackbarTitleProps = ComponentProps<typeof BaseToast.Title>;
export type SnackbarDescriptionProps = ComponentProps<
  typeof BaseToast.Description
>;
export type SnackbarActionProps = ComponentProps<typeof BaseToast.Action>;
export type SnackbarCloseProps = ComponentProps<typeof BaseToast.Close>;

export const snackbarManager = BaseToast.createToastManager();

function SnackbarPortal(props: SnackbarPortalProps) {
  return <BaseToast.Portal {...props} />;
}

function SnackbarViewport({ className, ...props }: SnackbarViewportProps) {
  return (
    <BaseToast.Viewport
      className={cn(
        "fixed right-4 bottom-4 z-[1600] mx-auto w-[calc(100vw-2rem)] outline-none sm:right-8 sm:bottom-8 sm:w-[22.5rem]",
        className,
      )}
      {...props}
    />
  );
}

function SnackbarRoot({ className, ...props }: SnackbarRootProps) {
  return (
    <BaseToast.Root
      className={cn(
        "[--gap:0.75rem] [--peek:0.5rem] [--scale:calc(max(0,1-(var(--toast-index)*0.04)))] [--shrink:calc(1-var(--scale))] [--height:var(--toast-frontmost-height,var(--toast-height))] [--offset-y:calc(var(--toast-offset-y)*-1+calc(var(--toast-index)*var(--gap)*-1)+var(--toast-swipe-movement-y))] absolute right-0 bottom-0 z-[calc(1600-var(--toast-index))] h-[var(--height)] w-full origin-bottom border border-hairline-strong border-l-4 border-l-primary bg-canvas text-ink [transform:translateX(var(--toast-swipe-movement-x))_translateY(calc(var(--toast-swipe-movement-y)-(var(--toast-index)*var(--peek))-(var(--shrink)*var(--height))))_scale(var(--scale))] transition-[transform,opacity,height] duration-300 ease-out data-[expanded]:h-[var(--toast-height)] data-[expanded]:[transform:translateX(var(--toast-swipe-movement-x))_translateY(var(--offset-y))] data-[limited]:opacity-0 data-[starting-style]:translate-y-[150%] data-[type=error]:border-l-error data-[type=loading]:border-l-ink-subtle data-[type=success]:border-l-success focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-focus",
        className,
      )}
      swipeDirection="right"
      {...props}
    />
  );
}

function SnackbarContent({ className, ...props }: SnackbarContentProps) {
  return (
    <BaseToast.Content
      className={cn(
        "flex min-h-16 items-center gap-4 overflow-hidden px-4 py-3 data-[behind]:opacity-0 data-[expanded]:opacity-100",
        className,
      )}
      {...props}
    />
  );
}

function SnackbarTitle({ className, ...props }: SnackbarTitleProps) {
  return (
    <BaseToast.Title
      className={cn("text-button text-ink", className)}
      {...props}
    />
  );
}

function SnackbarDescription({
  className,
  ...props
}: SnackbarDescriptionProps) {
  return (
    <BaseToast.Description
      className={cn("mt-1 text-body-sm text-ink-muted", className)}
      {...props}
    />
  );
}

function SnackbarAction({ className, ...props }: SnackbarActionProps) {
  return (
    <BaseToast.Action
      className={cn(
        "shrink-0 cursor-pointer rounded-none border border-transparent bg-transparent px-2 py-2 text-button text-primary hover:bg-surface-1 focus-visible:outline-2 focus-visible:outline-focus",
        className,
      )}
      {...props}
    />
  );
}

function SnackbarClose({ className, children, ...props }: SnackbarCloseProps) {
  return (
    <BaseToast.Close
      aria-label={children ? undefined : "Dismiss notification"}
      className={cn(
        "inline-flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-none border border-transparent bg-transparent p-0 text-ink hover:bg-surface-1 focus-visible:outline-2 focus-visible:outline-focus",
        className,
      )}
      {...props}
    >
      {children ?? (
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M3.5 3.5l9 9m0-9-9 9"
            stroke="currentColor"
            strokeWidth="1.5"
          />
        </svg>
      )}
    </BaseToast.Close>
  );
}

function SnackbarItem({ toast }: { toast: SnackbarToast }) {
  return (
    <SnackbarRoot toast={toast}>
      <SnackbarContent>
        <div className="min-w-0 flex-1">
          <SnackbarTitle />
          <SnackbarDescription />
          {toast.actionProps ? <SnackbarAction /> : null}
        </div>
        <SnackbarClose />
      </SnackbarContent>
    </SnackbarRoot>
  );
}

function SnackbarList() {
  const { toasts } = BaseToast.useToastManager();
  return toasts.map((toast) => <SnackbarItem key={toast.id} toast={toast} />);
}

export interface AppSnackbarProviderProps extends Omit<
  SnackbarProviderProps,
  "toastManager"
> {
  children: ReactNode;
  toastManager?: SnackbarProviderProps["toastManager"];
  viewportProps?: SnackbarViewportProps;
}

function SnackbarProvider({
  children,
  toastManager = snackbarManager,
  viewportProps,
  ...props
}: AppSnackbarProviderProps) {
  return (
    <BaseToast.Provider toastManager={toastManager} {...props}>
      {children}
      <SnackbarPortal>
        <SnackbarViewport {...viewportProps}>
          <SnackbarList />
        </SnackbarViewport>
      </SnackbarPortal>
    </BaseToast.Provider>
  );
}

export const Snackbar = {
  Provider: SnackbarProvider,
  Portal: SnackbarPortal,
  Viewport: SnackbarViewport,
  Root: SnackbarRoot,
  Content: SnackbarContent,
  Title: SnackbarTitle,
  Description: SnackbarDescription,
  Action: SnackbarAction,
  Close: SnackbarClose,
  List: SnackbarList,
  useManager: BaseToast.useToastManager,
  createManager: BaseToast.createToastManager,
  manager: snackbarManager,
};
