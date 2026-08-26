import { Button } from "../button";
import { StorySection } from "./story-section";

export function ButtonStories() {
  return (
    <StorySection
      id="button"
      title="Button"
      description="Variants, sizes, disabled state, and icon controls."
    >
      <div className="flex flex-wrap items-center gap-3">
        <Button>Primary</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="outline">Outline</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="destructive">Delete</Button>
        <Button variant="link">Text link</Button>
        <Button disabled>Disabled</Button>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Button size="xs">Extra small</Button>
        <Button size="sm">Small</Button>
        <Button size="default">Default</Button>
        <Button size="lg">Large</Button>
        <Button size="icon" aria-label="Add item" title="Add item">
          <span aria-hidden="true" className="text-xl leading-none">
            +
          </span>
        </Button>
      </div>
    </StorySection>
  );
}
