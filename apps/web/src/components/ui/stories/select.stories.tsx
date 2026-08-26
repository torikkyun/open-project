import { useState } from "react";
import { Select } from "../select";
import { StorySection } from "./story-section";

const options = [
  { label: "Design", value: "design" },
  { label: "Engineering", value: "engineering" },
  { label: "Operations", value: "operations" },
];

const watchers = [
  { label: "An Tran", value: "an-tran" },
  { label: "Bao Le", value: "bao-le" },
  { label: "Chi Ngo", value: "chi-ngo" },
  { label: "Dung Pham", value: "dung-pham" },
];

function ExampleSelect({ disabled = false }: { disabled?: boolean }) {
  return (
    <Select.Root items={options} disabled={disabled}>
      <Select.Trigger
        className="w-64"
        placeholder="Choose a team"
        aria-label="Team"
      />
      <Select.Portal>
        <Select.Positioner>
          <Select.Popup>
            <Select.List>
              {options.map((option) => (
                <Select.Item key={option.value} value={option.value}>
                  {option.label}
                </Select.Item>
              ))}
            </Select.List>
          </Select.Popup>
        </Select.Positioner>
      </Select.Portal>
    </Select.Root>
  );
}

function MultipleSelectStory() {
  const [selectedWatchers, setSelectedWatchers] = useState<string[]>([
    "an-tran",
    "bao-le",
  ]);

  return (
    <div className="flex w-full max-w-[32rem] basis-full shrink-0 flex-col gap-2">
      <span className="text-sm font-semibold text-ink">Watchers</span>
      <div className="flex min-h-12 flex-wrap items-center gap-2 border-b border-hairline-strong bg-surface-1 px-3 py-2 focus-within:border-b-2 focus-within:border-primary">
        {selectedWatchers.map((value) => {
          const watcher = watchers.find((item) => item.value === value);

          return (
            <span
              key={value}
              className="inline-flex h-7 shrink-0 items-center gap-2 whitespace-nowrap border border-hairline-strong bg-canvas pl-2 text-xs text-ink"
            >
              {watcher?.label ?? value}
              <button
                type="button"
                className="inline-flex size-7 cursor-pointer items-center justify-center border-0 border-l border-hairline bg-transparent text-ink-muted hover:bg-surface-2 hover:text-ink focus-visible:outline-2 focus-visible:outline-focus"
                aria-label={`Remove ${watcher?.label ?? value}`}
                onClick={() => {
                  setSelectedWatchers((current) =>
                    current.filter((item) => item !== value),
                  );
                }}
              >
                <span aria-hidden="true">×</span>
              </button>
            </span>
          );
        })}

        <Select.Root
          items={watchers}
          multiple
          value={selectedWatchers}
          onValueChange={(value) => {
            setSelectedWatchers(value as string[]);
          }}
        >
          <Select.Trigger
            className="min-w-40 flex-1 border-b-0 bg-transparent px-2 py-1 text-sm focus-visible:border-b-0 data-[popup-open]:border-b-0"
            placeholder="Add watchers"
            valueChildren={() => "Add watchers"}
            aria-label="Watchers"
          />
          <Select.Portal>
            <Select.Positioner>
              <Select.Popup>
                <Select.List>
                  {watchers.map((watcher) => (
                    <Select.Item key={watcher.value} value={watcher.value}>
                      {watcher.label}
                    </Select.Item>
                  ))}
                </Select.List>
              </Select.Popup>
            </Select.Positioner>
          </Select.Portal>
        </Select.Root>
      </div>
      <span className="text-xs leading-[1.33] text-ink-subtle">
        Selected watchers receive task notifications.
      </span>
    </div>
  );
}

export function SelectStories() {
  return (
    <StorySection
      id="select"
      title="Select"
      description="Empty, selected, disabled, and multiple selection with removable tags."
    >
      <ExampleSelect />
      <Select.Root items={options} defaultValue="engineering">
        <Select.Trigger
          className="w-64"
          placeholder="Choose a team"
          aria-label="Team"
        />
        <Select.Portal>
          <Select.Positioner>
            <Select.Popup>
              <Select.List>
                {options.map((option) => (
                  <Select.Item key={option.value} value={option.value}>
                    {option.label}
                  </Select.Item>
                ))}
              </Select.List>
            </Select.Popup>
          </Select.Positioner>
        </Select.Portal>
      </Select.Root>
      <ExampleSelect disabled />
      <MultipleSelectStory />
    </StorySection>
  );
}
