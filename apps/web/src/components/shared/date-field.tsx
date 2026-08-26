import type { ReactNode } from "react";
import type { DateValue } from "react-aria-components";
import { DatePicker, type DatePickerRootProps } from "../ui/date-picker";
import { cn } from "../ui/cn";

export interface DateFieldProps<T extends DateValue> extends Omit<
  DatePickerRootProps<T>,
  "children" | "className" | "isInvalid" | "isRequired"
> {
  label: ReactNode;
  description?: ReactNode;
  error?: ReactNode;
  isInvalid?: boolean;
  required?: boolean;
  className?: string;
}

export function DateField<T extends DateValue>({
  label,
  description,
  error,
  isInvalid,
  required,
  className,
  ...props
}: DateFieldProps<T>) {
  return (
    <DatePicker.Root
      className={cn("w-full", className)}
      isInvalid={isInvalid ?? Boolean(error)}
      isRequired={required}
      {...props}
    >
      <DatePicker.Label>
        {label}
        {required && (
          <span aria-hidden="true" className="text-error">
            {" *"}
          </span>
        )}
      </DatePicker.Label>
      <DatePicker.Group>
        <DatePicker.Input>
          {(segment) => <DatePicker.Segment segment={segment} />}
        </DatePicker.Input>
        <DatePicker.Trigger />
      </DatePicker.Group>
      {error ? (
        <DatePicker.Error>{error}</DatePicker.Error>
      ) : (
        description && (
          <DatePicker.Description>{description}</DatePicker.Description>
        )
      )}
      <DatePicker.Popover>
        <DatePicker.CalendarContent />
      </DatePicker.Popover>
    </DatePicker.Root>
  );
}
