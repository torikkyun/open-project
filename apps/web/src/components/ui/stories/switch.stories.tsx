import { Switch } from "../switch";
import { StorySection } from "./story-section";

function Preference({
  children,
  description,
  ...props
}: Switch.Root.Props & {
  children: string;
  description: string;
}) {
  return (
    <label className="flex min-h-12 cursor-pointer items-center justify-between gap-6 border-b border-hairline py-2 text-ink has-[[data-disabled]]:cursor-not-allowed has-[[data-disabled]]:text-ink-subtle">
      <span>
        <span className="block text-body-sm">{children}</span>
        <span className="block text-xs text-ink-muted">{description}</span>
      </span>
      <Switch.Root {...props}>
        <Switch.Thumb />
      </Switch.Root>
    </label>
  );
}

export function SwitchStories() {
  return (
    <StorySection
      id="switch"
      title="Switch"
      description="Notification preferences in on, off, and disabled states."
    >
      <div className="w-full max-w-[32rem]">
        <Preference
          name="assignmentNotifications"
          defaultChecked
          description="Notify when a task is assigned to you."
        >
          Assignment notifications
        </Preference>
        <Preference
          name="dueDateReminders"
          description="Notify three days before a task is due."
        >
          Due date reminders
        </Preference>
        <Preference
          disabled
          description="Managed by your workspace administrator."
        >
          Weekly summary
        </Preference>
      </div>
    </StorySection>
  );
}
