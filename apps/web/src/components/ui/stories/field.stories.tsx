import { Field } from "../field";
import { Input } from "../input";
import { StorySection } from "./story-section";

export function FieldStories() {
  return (
    <StorySection
      id="field"
      title="Field"
      description="Label, helper text, required validation, invalid, and disabled states."
    >
      <Field.Root className="w-full max-w-80">
        <Field.Label>Email address</Field.Label>
        <Input type="email" placeholder="name@example.com" />
        <Field.Description>Used for account notifications.</Field.Description>
      </Field.Root>

      <Field.Root className="w-full max-w-80" invalid>
        <Field.Label>Project slug</Field.Label>
        <Input defaultValue="Invalid slug!" />
        <Field.Error match>Use lowercase letters and hyphens only.</Field.Error>
      </Field.Root>

      <Field.Root className="w-full max-w-80" disabled>
        <Field.Label>Organization</Field.Label>
        <Input defaultValue="Acme Inc." />
        <Field.Description>Managed by workspace owner.</Field.Description>
      </Field.Root>

      <Field.Root className="w-full max-w-80">
        <Field.Label>Display name</Field.Label>
        <Input required placeholder="Required" />
        <Field.Error match="valueMissing">Enter a display name.</Field.Error>
      </Field.Root>
    </StorySection>
  );
}
