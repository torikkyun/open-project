import { Checkbox } from "../checkbox";
import { StorySection } from "./story-section";

function CheckboxLabel({
  children,
  ...props
}: React.ComponentProps<typeof Checkbox.Root>) {
  return (
    <label className="flex min-h-12 cursor-pointer items-center gap-3 text-sm text-ink has-[[data-disabled]]:cursor-not-allowed has-[[data-disabled]]:text-ink-subtle">
      <Checkbox.Root {...props} />
      {children}
    </label>
  );
}

export function CheckboxStories() {
  return (
    <StorySection
      id="checkbox"
      title="Checkbox"
      description="Unchecked, checked, indeterminate, and disabled states."
    >
      <div className="flex flex-col gap-1">
        <CheckboxLabel>Unchecked</CheckboxLabel>
        <CheckboxLabel defaultChecked>Checked</CheckboxLabel>
        <CheckboxLabel indeterminate>Indeterminate</CheckboxLabel>
        <CheckboxLabel disabled>Disabled</CheckboxLabel>
        <CheckboxLabel defaultChecked disabled>
          Checked disabled
        </CheckboxLabel>
      </div>
    </StorySection>
  );
}
