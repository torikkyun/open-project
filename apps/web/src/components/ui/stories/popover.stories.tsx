import { Popover } from "../popover";
import { StorySection } from "./story-section";

const notifications = [
  {
    id: 1,
    unread: true,
    text: 'A. Tran assigned you to "Design the data model"',
    time: "2m",
  },
  {
    id: 2,
    unread: false,
    text: '"Landing page copy" is due in 3 days',
    time: "1h",
  },
  {
    id: 3,
    unread: true,
    text: '"API contract" moved to Review',
    time: "5h",
  },
];

export function PopoverStories() {
  return (
    <StorySection
      id="popover"
      title="Popover"
      description="Anchored content, collision handling, keyboard dismissal, and notification layout."
    >
      <Popover.Root>
        <Popover.Trigger>Notifications (3)</Popover.Trigger>
        <Popover.Portal>
          <Popover.Positioner align="end">
            <Popover.Popup className="w-[22rem] p-0">
              <Popover.Arrow />
              <div className="flex min-h-12 items-center justify-between border-b border-hairline px-4">
                <Popover.Title>Notifications</Popover.Title>
                <button
                  type="button"
                  className="min-h-10 px-2 text-button text-primary hover:bg-surface-1 focus-visible:outline-2 focus-visible:outline-focus"
                >
                  Mark all
                </button>
              </div>
              <ul className="divide-y divide-hairline">
                {notifications.map((notification) => (
                  <li key={notification.id}>
                    <button
                      type="button"
                      className="grid min-h-16 w-full grid-cols-[8px_1fr] gap-3 px-4 py-3 text-left hover:bg-surface-1 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus"
                    >
                      <span
                        className={
                          notification.unread
                            ? "mt-1.5 size-2 bg-primary"
                            : "mt-1.5 size-2 border border-ink-subtle"
                        }
                        aria-hidden="true"
                      />
                      <span className="min-w-0">
                        <span className="block text-body-sm text-ink">
                          {notification.text}
                        </span>
                        <span className="mt-1 block text-caption text-ink-muted">
                          {notification.time} · #tasks
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
              <div className="flex justify-end border-t border-hairline px-2 py-1">
                <Popover.Close>Close</Popover.Close>
              </div>
            </Popover.Popup>
          </Popover.Positioner>
        </Popover.Portal>
      </Popover.Root>
    </StorySection>
  );
}
