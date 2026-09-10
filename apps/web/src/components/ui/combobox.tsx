import { Combobox as BaseCombobox } from "@base-ui/react";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "./cn";

function ComboboxRoot(props: ComponentProps<typeof BaseCombobox.Root>) {
  return <BaseCombobox.Root {...props} />;
}

function ComboboxLabel({
  className,
  ...props
}: ComponentProps<typeof BaseCombobox.Label>) {
  return (
    <BaseCombobox.Label
      className={cn(
        // Carbon spec: label-01 (body-sm, weight 400, ink-muted)
        "text-body-sm font-normal tracking-body text-ink-muted mb-2 block",
        className,
      )}
      {...props}
    />
  );
}

// Carbon Default Field Size: 40px (min-h-10).
// Góc vuông tuyệt đối (rounded-none) theo đúng spec.
const inputGroupClasses =
  "relative flex h-10 w-full items-center border-b border-hairline-strong bg-surface-1 text-ink transition-colors hover:bg-surface-2 focus-within:border-b-2 focus-within:border-primary data-[disabled]:border-hairline data-[disabled]:bg-surface-2 data-[disabled]:text-ink-subtle rounded-none";

function ComboboxInputGroup({
  className,
  ...props
}: ComponentProps<typeof BaseCombobox.InputGroup>) {
  return (
    <BaseCombobox.InputGroup
      className={cn(inputGroupClasses, className)}
      {...props}
    />
  );
}

function ComboboxInput({
  className,
  ...props
}: ComponentProps<typeof BaseCombobox.Input>) {
  return (
    <BaseCombobox.Input
      className={cn(
        // Carbon spec padding: 11px vertical, 16px horizontal (px-4)
        // Typography: body-sm (14px), line-height 1.29, tracking 0.16px
        "min-w-0 flex-1 border-0 bg-transparent px-4 py-[11px] text-body-sm leading-[1.29] tracking-body text-ink outline-none placeholder:text-ink-subtle disabled:cursor-not-allowed disabled:text-ink-subtle",
        className,
      )}
      {...props}
    />
  );
}

interface ComboboxTriggerProps extends ComponentProps<
  typeof BaseCombobox.Trigger
> {
  children?: ReactNode;
}

// Nút bấm thu nhỏ về size-10 (40x40px) để cân đối với container min-h-10
function ComboboxTrigger({
  className,
  children,
  ...props
}: ComboboxTriggerProps) {
  return (
    <BaseCombobox.Trigger
      className={cn(
        "inline-flex size-10 shrink-0 cursor-pointer items-center justify-center border-0 bg-transparent p-0 text-ink-muted hover:bg-surface-2 hover:text-ink focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus disabled:cursor-not-allowed disabled:text-ink-subtle transition-colors rounded-none",
        className,
      )}
      {...props}
    >
      {children ?? <ChevronDownIcon />}
    </BaseCombobox.Trigger>
  );
}

function ComboboxClear({
  className,
  ...props
}: ComponentProps<typeof BaseCombobox.Clear>) {
  return (
    <BaseCombobox.Clear
      className={cn(
        "inline-flex size-10 shrink-0 cursor-pointer items-center justify-center border-0 bg-transparent p-0 text-ink-muted hover:bg-surface-2 hover:text-ink focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus data-[disabled]:cursor-not-allowed data-[disabled]:text-ink-subtle transition-colors rounded-none",
        className,
      )}
      {...props}
    >
      <CloseIcon />
    </BaseCombobox.Clear>
  );
}

function ComboboxPortal(props: ComponentProps<typeof BaseCombobox.Portal>) {
  return <BaseCombobox.Portal {...props} />;
}

function ComboboxPositioner({
  className,
  ...props
}: ComponentProps<typeof BaseCombobox.Positioner>) {
  return (
    <BaseCombobox.Positioner
      className={cn("z-[1400] outline-none", className)}
      {...props}
    />
  );
}

// Popup cũng phải giữ góc vuông (rounded-none) theo đúng spec
const popupClasses =
  "max-h-[var(--available-height)] min-w-[var(--anchor-width)] origin-[var(--transform-origin)] overflow-hidden rounded-none border border-hairline bg-canvas text-ink opacity-0 shadow-lg transition-[scale,opacity] duration-150 ease-out data-[open]:opacity-100 data-[starting-style]:scale-[0.98] data-[starting-style]:opacity-0 data-[ending-style]:scale-[0.98] data-[ending-style]:opacity-0";

function ComboboxPopup({
  className,
  ...props
}: ComponentProps<typeof BaseCombobox.Popup>) {
  return (
    <BaseCombobox.Popup className={cn(popupClasses, className)} {...props} />
  );
}

function ComboboxList({
  className,
  ...props
}: ComponentProps<typeof BaseCombobox.List>) {
  return (
    <BaseCombobox.List
      className={cn(
        "max-h-[var(--available-height)] overflow-y-auto py-1 scroll-py-1",
        className,
      )}
      {...props}
    />
  );
}

function ComboboxItem({
  className,
  children,
  ...props
}: ComponentProps<typeof BaseCombobox.Item>) {
  return (
    <BaseCombobox.Item
      className={cn(
        // Padding 8px dọc, 16px ngang. Thêm truncate để xử lý tên dự án dài
        "group flex cursor-pointer items-center gap-3 px-4 py-2 text-body-sm leading-[1.29] tracking-body text-ink outline-none data-[highlighted]:bg-surface-2 data-[selected]:text-primary data-[disabled]:cursor-not-allowed data-[disabled]:text-ink-subtle transition-colors",
        className,
      )}
      {...props}
    >
      <BaseCombobox.ItemIndicator className="inline-flex w-4 shrink-0 text-primary invisible group-data-[selected]:visible">
        <CheckIcon />
      </BaseCombobox.ItemIndicator>
      <span className="truncate">{children}</span>
    </BaseCombobox.Item>
  );
}

function ComboboxItemIndicator({
  className,
  ...props
}: ComponentProps<typeof BaseCombobox.ItemIndicator>) {
  return (
    <BaseCombobox.ItemIndicator
      className={cn("inline-flex w-4 shrink-0 text-primary", className)}
      {...props}
    />
  );
}

function ComboboxEmpty({
  className,
  ...props
}: ComponentProps<typeof BaseCombobox.Empty>) {
  return (
    <BaseCombobox.Empty
      className={cn("px-4 py-2 text-body-sm text-ink-subtle", className)}
      {...props}
    />
  );
}

export const Combobox = {
  Root: ComboboxRoot,
  Label: ComboboxLabel,
  InputGroup: ComboboxInputGroup,
  Input: ComboboxInput,
  Value: BaseCombobox.Value,
  Trigger: ComboboxTrigger,
  Clear: ComboboxClear,
  Portal: ComboboxPortal,
  Positioner: ComboboxPositioner,
  Popup: ComboboxPopup,
  List: ComboboxList,
  Item: ComboboxItem,
  ItemIndicator: ComboboxItemIndicator,
  Empty: ComboboxEmpty,
  Status: BaseCombobox.Status,
  Group: BaseCombobox.Group,
  GroupLabel: BaseCombobox.GroupLabel,
  Separator: BaseCombobox.Separator,
  Collection: BaseCombobox.Collection,
  Chips: BaseCombobox.Chips,
  Chip: BaseCombobox.Chip,
  ChipRemove: BaseCombobox.ChipRemove,
  useFilter: BaseCombobox.useFilter,
  useFilteredItems: BaseCombobox.useFilteredItems,
};

// Icon kích thước chuẩn Carbon: 16x16px
function CheckIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
    >
      <path d="M3 8l3.5 3.5L13 5" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function ChevronDownIcon() {
  return (
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
  );
}

function CloseIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="m4.5 4.5 7 7m-7 0 7-7"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="square"
      />
    </svg>
  );
}
