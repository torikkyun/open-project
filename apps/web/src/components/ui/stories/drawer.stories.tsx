import { Drawer } from "../drawer";
import { StorySection } from "./story-section";

const navigation = ["My Tasks", "Projects", "Tasks", "Gantt", "Members"];

export function DrawerStories() {
  return (
    <StorySection
      id="drawer"
      title="Drawer"
      description="Swipeable mobile navigation and bottom-sheet compositions."
    >
      <Drawer.Root swipeDirection="left">
        <Drawer.Trigger>Open mobile sidebar</Drawer.Trigger>
        <Drawer.Portal>
          <Drawer.Backdrop />
          <Drawer.Viewport>
            <Drawer.Popup className="p-0">
              <Drawer.Content className="flex h-full max-w-none flex-col bg-surface-1">
                <header className="flex min-h-16 items-center justify-between border-b border-hairline bg-canvas pl-5 pr-2">
                  <Drawer.Title className="text-subhead">
                    Open Project
                  </Drawer.Title>
                  <Drawer.Close />
                </header>
                <nav aria-label="Mobile navigation" className="flex-1 py-4">
                  {navigation.map((item) => (
                    <button
                      key={item}
                      type="button"
                      className={cnNavItem(item === "Projects")}
                    >
                      {item}
                    </button>
                  ))}
                </nav>
                <div className="border-t border-hairline p-4">
                  <button
                    type="button"
                    className="min-h-12 w-full px-4 text-left text-body-sm text-ink hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-focus"
                  >
                    Setup
                  </button>
                </div>
              </Drawer.Content>
            </Drawer.Popup>
          </Drawer.Viewport>
        </Drawer.Portal>
      </Drawer.Root>

      <Drawer.Root swipeDirection="down">
        <Drawer.Trigger variant="secondary">Open bottom sheet</Drawer.Trigger>
        <Drawer.Portal>
          <Drawer.Backdrop />
          <Drawer.Viewport>
            <Drawer.Popup>
              <div
                aria-hidden="true"
                className="mx-auto mb-4 h-1 w-12 bg-surface-2"
              />
              <Drawer.Content>
                <Drawer.Title>Quick actions</Drawer.Title>
                <Drawer.Description>
                  Swipe down, press Escape, or use the close action.
                </Drawer.Description>
                <div className="mt-6 flex justify-end">
                  <Drawer.Close variant="secondary">Close</Drawer.Close>
                </div>
              </Drawer.Content>
            </Drawer.Popup>
          </Drawer.Viewport>
        </Drawer.Portal>
      </Drawer.Root>
    </StorySection>
  );
}

function cnNavItem(active: boolean) {
  return [
    "relative min-h-12 w-full px-5 text-left text-body-sm text-ink hover:bg-surface-2 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus",
    active
      ? "bg-surface-2 font-semibold before:absolute before:inset-y-0 before:left-0 before:w-[3px] before:bg-primary"
      : "",
  ]
    .filter(Boolean)
    .join(" ");
}
