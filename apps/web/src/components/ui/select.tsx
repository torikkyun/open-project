import { Select as BaseSelect } from "@base-ui/react";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "./cn";

function SelectRoot(props: ComponentProps<typeof BaseSelect.Root>) {
  return <BaseSelect.Root {...props} />;
}

interface SelectTriggerProps extends ComponentProps<typeof BaseSelect.Trigger> {
  placeholder?: ReactNode;
  valueChildren?: ComponentProps<typeof BaseSelect.Value>["children"];
}

const triggerClasses =
  "group flex min-w-40 cursor-pointer select-none items-center justify-between gap-2 rounded-none border-0 border-b border-hairline-strong bg-surface-1 px-4 py-[11px] text-base leading-[1.5] tracking-body text-ink transition-colors hover:not-data-[disabled]:bg-surface-2 focus-visible:border-b-2 focus-visible:border-primary focus-visible:outline-none data-[popup-open]:border-b-2 data-[popup-open]:border-primary data-[disabled]:cursor-not-allowed data-[disabled]:border-hairline data-[disabled]:bg-surface-2 data-[disabled]:text-ink-subtle";

function SelectTrigger({
  placeholder,
  valueChildren,
  className,
  ...props
}: SelectTriggerProps) {
  return (
    <BaseSelect.Trigger className={cn(triggerClasses, className)} {...props}>
      <BaseSelect.Value
        className="overflow-hidden text-ellipsis whitespace-nowrap data-[placeholder]:text-ink-subtle"
        placeholder={placeholder}
      >
        {valueChildren}
      </BaseSelect.Value>
      <BaseSelect.Icon className="inline-flex text-ink-muted transition-transform duration-150 group-data-[popup-open]:rotate-180">
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M4 6l4 4 4-4"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="square"
          />
        </svg>
      </BaseSelect.Icon>
    </BaseSelect.Trigger>
  );
}

function SelectValue({
  className,
  ...props
}: ComponentProps<typeof BaseSelect.Value>) {
  return (
    <BaseSelect.Value
      className={cn(
        "overflow-hidden text-ellipsis whitespace-nowrap data-[placeholder]:text-ink-subtle",
        className,
      )}
      {...props}
    />
  );
}

function SelectIcon({
  className,
  ...props
}: ComponentProps<typeof BaseSelect.Icon>) {
  return (
    <BaseSelect.Icon
      className={cn(
        "inline-flex text-ink-muted transition-transform duration-150",
        className,
      )}
      {...props}
    />
  );
}

function SelectPortal(props: ComponentProps<typeof BaseSelect.Portal>) {
  return <BaseSelect.Portal {...props} />;
}

function SelectPositioner({
  alignItemWithTrigger = false,
  align = "start",
  sideOffset = 4,
  className,
  ...props
}: ComponentProps<typeof BaseSelect.Positioner>) {
  return (
    <BaseSelect.Positioner
      alignItemWithTrigger={alignItemWithTrigger}
      align={align}
      sideOffset={sideOffset}
      className={cn("z-[1400] outline-none", className)}
      {...props}
    />
  );
}

const popupClasses =
  "max-h-[var(--available-height)] min-w-[var(--anchor-width)] origin-[var(--transform-origin)] scale-[0.98] overflow-hidden rounded-none border border-hairline bg-canvas opacity-0 shadow-lg transition-[scale,opacity] duration-150 ease-out data-[open]:scale-100 data-[open]:opacity-100 data-[ending-style]:scale-[0.98] data-[ending-style]:opacity-0 data-[starting-style]:scale-[0.98] data-[starting-style]:opacity-0";

function SelectPopup({
  className,
  ...props
}: ComponentProps<typeof BaseSelect.Popup>) {
  return (
    <BaseSelect.Popup className={cn(popupClasses, className)} {...props} />
  );
}

function SelectList({
  className,
  ...props
}: ComponentProps<typeof BaseSelect.List>) {
  return (
    <BaseSelect.List
      className={cn(
        "relative max-h-[var(--available-height)] overflow-y-auto py-1 scroll-py-1",
        className,
      )}
      {...props}
    />
  );
}

function SelectItem({
  className,
  children,
  ...props
}: ComponentProps<typeof BaseSelect.Item>) {
  return (
    <BaseSelect.Item
      className={cn(
        "group flex cursor-pointer items-center gap-2 px-4 py-2 text-sm leading-[1.29] tracking-body text-ink data-[highlighted]:bg-surface-1 data-[selected]:text-primary data-[disabled]:cursor-not-allowed data-[disabled]:text-ink-subtle",
        className,
      )}
      {...props}
    >
      <BaseSelect.ItemIndicator className="inline-flex w-4 text-primary invisible group-data-[selected]:visible">
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          aria-hidden="true"
        >
          <path d="M3 8l3.5 3.5L13 5" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      </BaseSelect.ItemIndicator>
      <BaseSelect.ItemText className="flex-1">{children}</BaseSelect.ItemText>
    </BaseSelect.Item>
  );
}

function SelectItemText(props: ComponentProps<typeof BaseSelect.ItemText>) {
  const { className, ...rest } = props;
  return <BaseSelect.ItemText className={cn("flex-1", className)} {...rest} />;
}

function SelectItemIndicator({
  className,
  ...props
}: ComponentProps<typeof BaseSelect.ItemIndicator>) {
  return (
    <BaseSelect.ItemIndicator
      className={cn("inline-flex w-4 text-primary", className)}
      {...props}
    />
  );
}

export const Select = {
  Root: SelectRoot,
  Trigger: SelectTrigger,
  Value: SelectValue,
  Icon: SelectIcon,
  Portal: SelectPortal,
  Positioner: SelectPositioner,
  Popup: SelectPopup,
  List: SelectList,
  Item: SelectItem,
  ItemText: SelectItemText,
  ItemIndicator: SelectItemIndicator,
  Group: BaseSelect.Group,
  GroupLabel: BaseSelect.GroupLabel,
  Separator: BaseSelect.Separator,
};
