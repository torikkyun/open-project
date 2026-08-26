import { parseDate } from "@internationalized/date";
import { DateField, FormField } from "../../shared";
import { Input } from "../input";
import { StorySection } from "./story-section";

export function FormConventionsStories() {
  return (
    <StorySection
      id="form-conventions"
      title="Form conventions"
      description="Shared label, required, description, validation, and date-field treatment."
    >
      <div className="grid w-full gap-6 md:grid-cols-2">
        <FormField
          className="max-w-[24rem]"
          label="Project name"
          name="projectName"
          required
          description="Shown to all workspace members."
        >
          <Input placeholder="Website redesign" />
        </FormField>

        <FormField
          className="max-w-[24rem]"
          label="Project slug"
          name="projectSlug"
          error="Use lowercase letters and hyphens only."
        >
          <Input defaultValue="Invalid slug!" />
        </FormField>

        <DateField
          className="max-w-[24rem]"
          label="Start date"
          name="startDate"
          required
          description="The first active day of the project."
          defaultValue={parseDate("2026-08-26")}
        />

        <DateField
          className="max-w-[24rem]"
          label="End date"
          name="endDate"
          defaultValue={parseDate("2026-07-20")}
          error="End date must be on or after the start date."
        />
      </div>
    </StorySection>
  );
}
