import {
  Button as AriaButton,
  Calendar as AriaCalendar,
  CalendarCell as AriaCalendarCell,
  CalendarGrid as AriaCalendarGrid,
  CalendarGridBody as AriaCalendarGridBody,
  CalendarGridHeader as AriaCalendarGridHeader,
  CalendarHeaderCell as AriaCalendarHeaderCell,
  CalendarHeading as AriaCalendarHeading,
  DateInput as AriaDateInput,
  DatePicker as AriaDatePicker,
  DateSegment as AriaDateSegment,
  Dialog as AriaDialog,
  FieldError as AriaFieldError,
  Group as AriaGroup,
  Label as AriaLabel,
  Popover as AriaPopover,
  Text as AriaText,
  type ButtonProps,
  type CalendarCellProps,
  type CalendarGridBodyProps,
  type CalendarGridHeaderProps,
  type CalendarGridProps,
  type CalendarHeaderCellProps,
  type CalendarHeadingProps,
  type CalendarProps,
  type DateInputProps,
  type DatePickerProps as AriaDatePickerProps,
  type DateSegmentProps,
  type DateValue,
  type DialogProps,
  type FieldErrorProps,
  type GroupProps,
  type LabelProps,
  type PopoverProps,
  type TextProps,
} from "react-aria-components";
import { cn } from "./cn";

export type DatePickerRootProps<T extends DateValue> = AriaDatePickerProps<T>;
export type DatePickerLabelProps = LabelProps;
export type DatePickerGroupProps = GroupProps;
export type DatePickerInputProps = DateInputProps;
export type DatePickerSegmentProps = DateSegmentProps;
export type DatePickerTriggerProps = ButtonProps;
export type DatePickerDescriptionProps = TextProps;
export type DatePickerErrorProps = FieldErrorProps;
export type DatePickerPopoverProps = PopoverProps;
export type DatePickerDialogProps = DialogProps;
export type DatePickerCalendarProps<T extends DateValue> = CalendarProps<T>;
export type DatePickerCalendarHeadingProps = CalendarHeadingProps;
export type DatePickerCalendarGridProps = CalendarGridProps;
export type DatePickerCalendarGridHeaderProps = CalendarGridHeaderProps;
export type DatePickerCalendarGridBodyProps = CalendarGridBodyProps;
export type DatePickerCalendarHeaderCellProps = CalendarHeaderCellProps;
export type DatePickerCalendarCellProps = CalendarCellProps;

function DatePickerRoot<T extends DateValue>({
  className,
  ...props
}: DatePickerRootProps<T>) {
  return (
    <AriaDatePicker
      className={cn(
        "group/date-picker flex w-full flex-col items-start gap-2 text-ink data-[disabled]:text-ink-subtle",
        className,
      )}
      {...props}
    />
  );
}

function DatePickerLabel({ className, ...props }: DatePickerLabelProps) {
  return (
    <AriaLabel
      className={cn(
        "text-body-sm font-semibold text-ink group-data-[disabled]/date-picker:text-ink-subtle",
        className,
      )}
      {...props}
    />
  );
}

function DatePickerGroup({ className, ...props }: DatePickerGroupProps) {
  return (
    <AriaGroup
      className={cn(
        "flex min-h-12 w-full items-stretch border-b border-hairline-strong bg-surface-1 text-ink transition-colors hover:bg-surface-2 focus-within:border-b-2 focus-within:border-primary data-[disabled]:border-hairline data-[disabled]:bg-surface-2 data-[invalid]:border-b-2 data-[invalid]:border-error",
        className,
      )}
      {...props}
    />
  );
}

function DatePickerInput({ className, ...props }: DatePickerInputProps) {
  return (
    <AriaDateInput
      className={cn(
        "flex min-w-0 flex-1 items-center px-4 text-base leading-6 tracking-body outline-none",
        className,
      )}
      {...props}
    />
  );
}

function DatePickerSegment({ className, ...props }: DatePickerSegmentProps) {
  return (
    <AriaDateSegment
      className={cn(
        "rounded-none px-px tabular-nums text-ink outline-none data-[disabled]:text-ink-subtle data-[focused]:bg-primary data-[focused]:text-on-primary data-[placeholder]:text-ink-subtle",
        className,
      )}
      {...props}
    />
  );
}

function DatePickerTrigger({
  className,
  children,
  ...props
}: DatePickerTriggerProps) {
  return (
    <AriaButton
      className={cn(
        "flex size-12 shrink-0 cursor-pointer items-center justify-center border-0 border-l border-hairline bg-transparent p-0 text-ink hover:bg-surface-2 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus data-[disabled]:cursor-not-allowed data-[disabled]:text-ink-subtle",
        className,
      )}
      {...props}
    >
      {children ?? <CalendarIcon />}
    </AriaButton>
  );
}

function DatePickerDescription({
  className,
  ...props
}: DatePickerDescriptionProps) {
  return (
    <AriaText
      slot="description"
      className={cn("text-caption text-ink-subtle", className)}
      {...props}
    />
  );
}

function DatePickerError({ className, ...props }: DatePickerErrorProps) {
  return (
    <AriaFieldError
      className={cn("text-caption text-error", className)}
      {...props}
    />
  );
}

function DatePickerPopover({
  className,
  offset = 8,
  ...props
}: DatePickerPopoverProps) {
  return (
    <AriaPopover
      className={cn(
        "max-w-[calc(100vw-2rem)] overflow-auto rounded-none border border-hairline-strong bg-canvas p-4 text-ink outline-none transition-[opacity,transform] duration-150 data-[entering]:translate-y-1 data-[entering]:opacity-0 data-[exiting]:translate-y-1 data-[exiting]:opacity-0",
        className,
      )}
      offset={offset}
      {...props}
    />
  );
}

function DatePickerDialog({ className, ...props }: DatePickerDialogProps) {
  return <AriaDialog className={cn("outline-none", className)} {...props} />;
}

function DatePickerCalendar<T extends DateValue>({
  className,
  ...props
}: DatePickerCalendarProps<T>) {
  return (
    <AriaCalendar
      className={cn("w-[17.5rem] max-w-full", className)}
      {...props}
    />
  );
}

function DatePickerCalendarHeading({
  className,
  ...props
}: DatePickerCalendarHeadingProps) {
  return (
    <AriaCalendarHeading
      className={cn(
        "flex min-h-10 flex-1 items-center justify-center text-body-sm font-semibold",
        className,
      )}
      {...props}
    />
  );
}

function DatePickerCalendarGrid({
  className,
  ...props
}: DatePickerCalendarGridProps) {
  return (
    <AriaCalendarGrid
      className={cn("w-full border-collapse border-spacing-0", className)}
      {...props}
    />
  );
}

function DatePickerCalendarGridHeader(
  props: DatePickerCalendarGridHeaderProps,
) {
  return <AriaCalendarGridHeader {...props} />;
}

function DatePickerCalendarGridBody(props: DatePickerCalendarGridBodyProps) {
  return <AriaCalendarGridBody {...props} />;
}

function DatePickerCalendarHeaderCell({
  className,
  ...props
}: DatePickerCalendarHeaderCellProps) {
  return (
    <AriaCalendarHeaderCell
      className={cn(
        "h-8 text-center text-caption font-normal text-ink-muted",
        className,
      )}
      {...props}
    />
  );
}

function DatePickerCalendarCell({
  className,
  ...props
}: DatePickerCalendarCellProps) {
  return (
    <AriaCalendarCell
      className={cn(
        "flex size-10 cursor-pointer items-center justify-center rounded-none text-body-sm outline-none data-[disabled]:cursor-not-allowed data-[disabled]:text-ink-subtle data-[focus-visible]:outline-2 data-[focus-visible]:-outline-offset-2 data-[focus-visible]:outline-focus data-[outside-month]:text-ink-subtle data-[pressed]:bg-surface-2 data-[selected]:bg-primary data-[selected]:text-on-primary data-[unavailable]:text-error data-[unavailable]:line-through",
        className,
      )}
      {...props}
    />
  );
}

function CalendarNavigationButton({
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <AriaButton
      className={cn(
        "flex size-10 cursor-pointer items-center justify-center rounded-none border border-transparent bg-transparent p-0 text-ink hover:bg-surface-1 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus data-[disabled]:cursor-not-allowed data-[disabled]:text-ink-subtle",
        className,
      )}
      {...props}
    >
      {children}
    </AriaButton>
  );
}

function DatePickerCalendarContent() {
  return (
    <DatePickerDialog>
      <DatePickerCalendar>
        <header className="mb-2 flex items-center">
          <CalendarNavigationButton slot="previous" aria-label="Previous month">
            <ChevronIcon direction="left" />
          </CalendarNavigationButton>
          <DatePickerCalendarHeading />
          <CalendarNavigationButton slot="next" aria-label="Next month">
            <ChevronIcon direction="right" />
          </CalendarNavigationButton>
        </header>
        <DatePickerCalendarGrid>
          <DatePickerCalendarGridHeader>
            {(day) => (
              <DatePickerCalendarHeaderCell>{day}</DatePickerCalendarHeaderCell>
            )}
          </DatePickerCalendarGridHeader>
          <DatePickerCalendarGridBody>
            {(date) => <DatePickerCalendarCell date={date} />}
          </DatePickerCalendarGridBody>
        </DatePickerCalendarGrid>
      </DatePickerCalendar>
    </DatePickerDialog>
  );
}

function CalendarIcon() {
  return (
    <svg
      aria-hidden="true"
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
    >
      <path
        d="M3.5 5.5h13v11h-13zM6 3.5v4M14 3.5v4M3.5 9h13"
        stroke="currentColor"
      />
    </svg>
  );
}

function ChevronIcon({ direction }: { direction: "left" | "right" }) {
  return (
    <svg
      aria-hidden="true"
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
    >
      <path
        d={direction === "left" ? "m10 3-5 5 5 5" : "m6 3 5 5-5 5"}
        stroke="currentColor"
      />
    </svg>
  );
}

export const DatePicker = {
  Root: DatePickerRoot,
  Label: DatePickerLabel,
  Group: DatePickerGroup,
  Input: DatePickerInput,
  Segment: DatePickerSegment,
  Trigger: DatePickerTrigger,
  Description: DatePickerDescription,
  Error: DatePickerError,
  Popover: DatePickerPopover,
  Dialog: DatePickerDialog,
  Calendar: DatePickerCalendar,
  CalendarHeading: DatePickerCalendarHeading,
  CalendarGrid: DatePickerCalendarGrid,
  CalendarGridHeader: DatePickerCalendarGridHeader,
  CalendarGridBody: DatePickerCalendarGridBody,
  CalendarHeaderCell: DatePickerCalendarHeaderCell,
  CalendarCell: DatePickerCalendarCell,
  CalendarContent: DatePickerCalendarContent,
};
