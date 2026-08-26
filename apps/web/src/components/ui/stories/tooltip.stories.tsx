import { Button } from "../button";
import { Tooltip } from "../tooltip";
import { StorySection } from "./story-section";

function ExampleTooltip({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <Tooltip.Root>
      <Tooltip.Trigger aria-label={label} render={<Button variant="outline" />}>
        {children}
      </Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Positioner sideOffset={8}>
          <Tooltip.Popup>
            <Tooltip.Arrow />
            {label}
          </Tooltip.Popup>
        </Tooltip.Positioner>
      </Tooltip.Portal>
    </Tooltip.Root>
  );
}

export function TooltipStories() {
  return (
    <StorySection
      id="tooltip"
      title="Tooltip"
      description="Hover or focus triggers to inspect delayed content and positioning."
    >
      <Tooltip.Provider>
        <div className="flex w-full max-w-[36rem] flex-wrap items-center gap-6">
          <ExampleTooltip label="View role permissions">
            <svg
              aria-hidden="true"
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
            >
              <circle cx="10" cy="10" r="7.25" stroke="currentColor" />
              <path d="M10 9v5M10 6v1" stroke="currentColor" />
            </svg>
          </ExampleTooltip>

          <Tooltip.Root>
            <Tooltip.Trigger
              aria-label="Website redesign accessibility review"
              className="block min-h-12 w-52 cursor-pointer truncate rounded-none border border-hairline bg-canvas px-4 text-left text-body-sm text-ink hover:bg-surface-1 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-focus"
            >
              Website redesign accessibility review
            </Tooltip.Trigger>
            <Tooltip.Portal>
              <Tooltip.Positioner side="bottom" align="start">
                <Tooltip.Popup>
                  <Tooltip.Arrow />
                  Website redesign accessibility review
                </Tooltip.Popup>
              </Tooltip.Positioner>
            </Tooltip.Portal>
          </Tooltip.Root>

          <Tooltip.Root disabled>
            <Tooltip.Trigger
              aria-label="Disabled tooltip"
              render={<Button disabled variant="outline" />}
            >
              Disabled
            </Tooltip.Trigger>
            <Tooltip.Portal>
              <Tooltip.Positioner>
                <Tooltip.Popup>Disabled tooltip</Tooltip.Popup>
              </Tooltip.Positioner>
            </Tooltip.Portal>
          </Tooltip.Root>
        </div>
      </Tooltip.Provider>
    </StorySection>
  );
}
