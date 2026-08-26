import { useId, useState } from "react";
import { Button } from "../button";
import { Checkbox } from "../checkbox";
import { CheckboxGroup } from "../checkbox-group";
import { Input } from "../input";
import { StorySection } from "./story-section";

const initialSubtasks = [
  { id: "entity-list", label: "Draft entity list" },
  { id: "pm-review", label: "Review with PM" },
  { id: "api-contract", label: "Confirm API contract" },
];

export function CheckboxGroupStories() {
  const labelId = useId();
  const [subtasks, setSubtasks] = useState(initialSubtasks);
  const [completed, setCompleted] = useState(["entity-list"]);
  const [newSubtask, setNewSubtask] = useState("");

  function addSubtask() {
    const label = newSubtask.trim();
    if (!label) return;

    setSubtasks((items) => [...items, { id: `subtask-${Date.now()}`, label }]);
    setNewSubtask("");
  }

  return (
    <StorySection
      id="checkbox-group"
      title="Checkbox group"
      description="Shared checklist state with a parent control and inline add row."
    >
      <div className="w-full max-w-[36rem]">
        <div className="mb-2 flex min-h-12 items-center justify-between gap-4">
          <span id={labelId} className="text-body-sm text-ink">
            Subtasks
          </span>
          <span className="text-body-sm tabular-nums text-ink-muted">
            {completed.length}/{subtasks.length} done
          </span>
        </div>

        <CheckboxGroup
          aria-labelledby={labelId}
          allValues={subtasks.map((item) => item.id)}
          value={completed}
          onValueChange={setCompleted}
        >
          <label className="flex min-h-12 cursor-pointer items-center gap-3 border-b border-hairline px-1 text-body-sm font-semibold">
            <Checkbox.Root parent />
            Select all
          </label>
          {subtasks.map((subtask) => (
            <label
              key={subtask.id}
              className="flex min-h-12 cursor-pointer items-center gap-3 border-b border-hairline px-1 text-body-sm"
            >
              <Checkbox.Root name="subtasks" value={subtask.id} />
              {subtask.label}
            </label>
          ))}
        </CheckboxGroup>

        <form
          className="mt-4 flex items-end gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            addSubtask();
          }}
        >
          <label className="min-w-0 flex-1 text-body-sm text-ink">
            Add subtask
            <Input
              aria-label="New subtask"
              placeholder="Describe the next step"
              value={newSubtask}
              onValueChange={setNewSubtask}
            />
          </label>
          <Button type="submit" variant="outline" size="lg">
            Add
          </Button>
        </form>
      </div>
    </StorySection>
  );
}
