import { Slider } from "../slider";
import { StorySection } from "./story-section";

export function SliderStories() {
  return (
    <StorySection
      id="slider"
      title="Slider"
      description="Single, range, vertical, and disabled numeric controls."
    >
      <div className="grid w-full max-w-[36rem] shrink-0 gap-8">
        <Slider.Root defaultValue={2} min={1} max={3} step={1}>
          <Slider.Label>Gantt zoom</Slider.Label>
          <Slider.Value>
            {(_, values) => ["Day", "Week", "Month"][values[0] - 1]}
          </Slider.Value>
          <Slider.Control>
            <Slider.Track>
              <Slider.Indicator />
              <Slider.Thumb aria-label="Gantt zoom" />
            </Slider.Track>
          </Slider.Control>
        </Slider.Root>

        <Slider.Root
          defaultValue={[20, 75]}
          minStepsBetweenValues={1}
          thumbCollisionBehavior="none"
        >
          <Slider.Label>Timeline window</Slider.Label>
          <Slider.Value>
            {(formattedValues) => formattedValues.join(" – ")}
          </Slider.Value>
          <Slider.Control>
            <Slider.Track>
              <Slider.Indicator />
              <Slider.Thumb index={0} aria-label="Window start" />
              <Slider.Thumb index={1} aria-label="Window end" />
            </Slider.Track>
          </Slider.Control>
        </Slider.Root>

        <div className="flex items-start gap-12">
          <Slider.Root orientation="vertical" defaultValue={35}>
            <Slider.Label>Vertical</Slider.Label>
            <Slider.Value />
            <Slider.Control>
              <Slider.Track>
                <Slider.Indicator />
                <Slider.Thumb aria-label="Vertical value" />
              </Slider.Track>
            </Slider.Control>
          </Slider.Root>

          <Slider.Root defaultValue={60} disabled className="w-56">
            <Slider.Label>Disabled</Slider.Label>
            <Slider.Value />
            <Slider.Control>
              <Slider.Track>
                <Slider.Indicator />
                <Slider.Thumb aria-label="Disabled value" />
              </Slider.Track>
            </Slider.Control>
          </Slider.Root>
        </div>
      </div>
    </StorySection>
  );
}
