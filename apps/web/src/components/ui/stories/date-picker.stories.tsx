import { parseDate } from "@internationalized/date";
import { DatePicker } from "../date-picker";
import { StorySection } from "./story-section";

function DatePickerField({
  label,
  errorMessage,
  ...props
}: React.ComponentProps<typeof DatePicker.Root> & { label: string }) {
  return (
    <DatePicker.Root
      className="w-full max-w-[20rem]"
      errorMessage={errorMessage}
      {...props}
    >
      <DatePicker.Label>{label}</DatePicker.Label>
      <DatePicker.Group>
        <DatePicker.Input>
          {(segment) => <DatePicker.Segment segment={segment} />}
        </DatePicker.Input>
        <DatePicker.Trigger />
      </DatePicker.Group>
      <DatePicker.Description>
        Use the calendar or type a date.
      </DatePicker.Description>
      <DatePicker.Error>{errorMessage}</DatePicker.Error>
      <DatePicker.Popover>
        <DatePicker.CalendarContent />
      </DatePicker.Popover>
    </DatePicker.Root>
  );
}

export function DatePickerStories() {
  return (
    <StorySection
      id="date-picker"
      title="Date picker"
      description="Accessible segmented input and calendar popup for project dates."
    >
      <DatePickerField
        label="Start date"
        name="startDate"
        defaultValue={parseDate("2026-08-26")}
      />
      <DatePickerField
        label="Project date"
        minValue={parseDate("2026-08-01")}
        maxValue={parseDate("2026-10-15")}
        defaultValue={parseDate("2026-07-20")}
        isInvalid
        errorMessage="Date must be within the project range."
      />
      <DatePickerField
        label="Disabled date"
        defaultValue={parseDate("2026-08-30")}
        isDisabled
      />
    </StorySection>
  );
}
