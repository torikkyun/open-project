import { parseDate } from "@internationalized/date";
import { DateField } from "../../shared";
import { StorySection } from "./story-section";

export function DatePickerStories() {
  return (
    <StorySection
      id="date-picker"
      title="Date picker"
      description="Accessible segmented input and calendar popup for project dates."
    >
      <DateField
        className="max-w-[20rem]"
        label="Start date"
        name="startDate"
        required
        description="Use the calendar or type a date."
        defaultValue={parseDate("2026-08-26")}
      />
      <DateField
        className="max-w-[20rem]"
        label="Project date"
        minValue={parseDate("2026-08-01")}
        maxValue={parseDate("2026-10-15")}
        defaultValue={parseDate("2026-07-20")}
        error="Date must be within the project range."
      />
      <DateField
        className="max-w-[20rem]"
        label="Disabled date"
        defaultValue={parseDate("2026-08-30")}
        isDisabled
      />
    </StorySection>
  );
}
