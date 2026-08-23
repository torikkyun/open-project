import { Select as BaseSelect } from "@base-ui/react";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "./cn";

function SelectRoot(props: ComponentProps<typeof BaseSelect.Root>) {
  return <BaseSelect.Root {...props} />;
}

interface SelectTriggerProps extends ComponentProps<typeof BaseSelect.Trigger> {
  placeholder?: ReactNode;
}

const triggerClasses =
  "group flex min-w-40 cursor-pointer items-center justify-between gap-2 rounded-none border-0 border-b border-hairline-strong bg-surface-1 px-4 py-[11px] text-base leading-[1.5] tracking-body text-ink transition-colors enabled:hover:bg-surface-2 focus:border-b-2 focus:border-primary focus:outline-none data-[popup-open]:border-b-2 data-[popup-open]:border-primary disabled:cursor-not-allowed disabled:border-hairline disabled:bg-surface-2 disabled:text-ink-subtle";

function SelectTrigger({ placeholder, className, ...props }: SelectTriggerProps) {
  return (
    <BaseSelect.Trigger className={cn(triggerClasses, className)} {...props}>
      <BaseSelect.Value
        className="overflow-hidden text-ellipsis whitespace-nowrap data-[placeholder]:text-ink-subtle"
        placeholder={placeholder}
      />
      <BaseSelect.Icon className="inline-flex text-ink-muted transition-transform duration-150 group-data-[popup-open]:rotate-180">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" />
        </svg>
      </BaseSelect.Icon>
    </BaseSelect.Trigger>
  );
}

function SelectValue(props: ComponentProps<typeof BaseSelect.Value>) {
  return (
    <BaseSelect.Value
      className={cn(
        "overflow-hidden text-ellipsis whitespace-nowrap data-[placeholder]:text-ink-subtle",
        props.className,
      )}
      {...props}
    />
  );
}

function SelectIcon(props: ComponentProps<typeof BaseSelect.Icon>) {
  return (
    <BaseSelect.Icon
      className={cn(
        "inline-flex text-ink-muted transition-transform duration-150",
        props.className,
      )}
      {...props}
    />
  );
}

function SelectPortal(props: ComponentProps<typeof BaseSelect.Portal>) {
  return <BaseSelect.Portal {...props} />;
}

function SelectPositioner(props: ComponentProps<typeof BaseSelect.Positioner>) {
  return <BaseSelect.Positioner className={cn("z-[1400]", props.className)} {...props} />;
}

const popupClasses =
  "max-h-80 min-w-40 origin-top scale-[0.98] overflow-auto rounded-none border border-hairline bg-canvas py-1 opacity-0 transition-all duration-150 ease-out data-[open]:scale-100 data-[open]:opacity-100 data-[ending-style]:scale-[0.98] data-[ending-style]:opacity-0 data-[starting-style]:scale-[0.98] data-[starting-style]:opacity-0";

function SelectPopup(props: ComponentProps<typeof BaseSelect.Popup>) {
  return <BaseSelect.Popup className={cn(popupClasses, props.className)} {...props} />;
}

function SelectItem({ className, children, ...props }: ComponentProps<typeof BaseSelect.Item>) {
  return (
    <BaseSelect.Item
      className={cn(
        "group flex cursor-pointer items-center gap-2 px-4 py-2 text-sm leading-[1.29] tracking-body text-ink data-[highlighted]:bg-surface-1 data-[selected]:text-primary data-[disabled]:cursor-not-allowed data-[disabled]:text-ink-subtle",
        className,
      )}
      {...props}
    >
      <BaseSelect.ItemIndicator className="inline-flex w-4 text-primary invisible group-data-[selected]:visible">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="M3 8l3.5 3.5L13 5" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      </BaseSelect.ItemIndicator>
      <BaseSelect.ItemText className="flex-1">{children}</BaseSelect.ItemText>
    </BaseSelect.Item>
  );
}

function SelectItemText(props: ComponentProps<typeof BaseSelect.ItemText>) {
  return <BaseSelect.ItemText className={cn("flex-1", props.className)} {...props} />;
}

function SelectItemIndicator(props: ComponentProps<typeof BaseSelect.ItemIndicator>) {
  return (
    <BaseSelect.ItemIndicator
      className={cn("inline-flex w-4 text-primary", props.className)}
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
  Item: SelectItem,
  ItemText: SelectItemText,
  ItemIndicator: SelectItemIndicator,
  Group: BaseSelect.Group,
  GroupLabel: BaseSelect.GroupLabel,
  Separator: BaseSelect.Separator,
};
