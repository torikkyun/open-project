import { Input } from "../input";
import { StorySection } from "./story-section";

export function InputStories() {
  return (
    <StorySection
      id="input"
      title="Input"
      description="Standalone input states. Use Field for labels and validation."
    >
      <label className="flex w-full max-w-80 flex-col gap-2 text-sm font-semibold text-ink">
        Default
        <Input placeholder="Enter a value" />
      </label>
      <label className="flex w-full max-w-[20rem] flex-col gap-2 text-sm font-semibold text-ink">
        Date
        <Input type="date" defaultValue="2026-08-26" />
      </label>
      <label className="flex w-full max-w-80 flex-col gap-2 text-sm font-semibold text-ink-subtle">
        Disabled
        <Input defaultValue="Unavailable value" disabled />
      </label>
    </StorySection>
  );
}
