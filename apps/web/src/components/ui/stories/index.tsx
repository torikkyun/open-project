import { ButtonStories } from "./button.stories";
import { CheckboxStories } from "./checkbox.stories";
import { CheckboxGroupStories } from "./checkbox-group.stories";
import { DatePickerStories } from "./date-picker.stories";
import { DialogStories } from "./dialog.stories";
import { DrawerStories } from "./drawer.stories";
import { FieldStories } from "./field.stories";
import { InputStories } from "./input.stories";
import { PopoverStories } from "./popover.stories";
import { SelectStories } from "./select.stories";
import { SliderStories } from "./slider.stories";
import { SnackbarStories } from "./snackbar.stories";
import { SwitchStories } from "./switch.stories";
import { TaskIndicatorsStories } from "./task-indicators.stories";
import { TableStories } from "./table.stories";
import { TabsStories } from "./tabs.stories";
import { TooltipStories } from "./tooltip.stories";

const storyLinks = [
  ["button", "Button"],
  ["checkbox", "Checkbox"],
  ["checkbox-group", "Checkbox group"],
  ["date-picker", "Date picker"],
  ["input", "Input"],
  ["field", "Field"],
  ["select", "Select"],
  ["slider", "Slider"],
  ["table", "Table"],
  ["dialog", "Dialog"],
  ["drawer", "Drawer"],
  ["popover", "Popover"],
  ["snackbar", "Snackbar"],
  ["switch", "Switch"],
  ["task-indicators", "Task indicators"],
  ["tabs", "Tabs"],
  ["tooltip", "Tooltip"],
] as const;

export function AllStories() {
  return (
    <main className="mx-auto w-full max-w-[1440px] px-5 py-8 sm:px-8 lg:px-12">
      <header className="pb-10">
        <p className="text-eyebrow font-semibold uppercase text-primary">
          UI inventory
        </p>
        <h1 className="mt-2 text-headline text-ink sm:text-display-md">
          Component stories
        </h1>
        <nav
          aria-label="Component stories"
          className="mt-6 flex flex-wrap gap-x-5 gap-y-2"
        >
          {storyLinks.map(([id, label]) => (
            <a
              key={id}
              className="text-sm text-primary underline-offset-4 hover:underline"
              href={`#${id}`}
            >
              {label}
            </a>
          ))}
        </nav>
      </header>

      <ButtonStories />
      <CheckboxStories />
      <CheckboxGroupStories />
      <DatePickerStories />
      <InputStories />
      <FieldStories />
      <SelectStories />
      <SliderStories />
      <TableStories />
      <DialogStories />
      <DrawerStories />
      <PopoverStories />
      <SnackbarStories />
      <SwitchStories />
      <TaskIndicatorsStories />
      <TabsStories />
      <TooltipStories />
    </main>
  );
}
