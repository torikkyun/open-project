import { Dialog } from "../dialog";
import { StorySection } from "./story-section";

export function DialogStories() {
  return (
    <StorySection
      id="dialog"
      title="Dialog"
      description="Convenience composition and low-level primitive composition."
    >
      <Dialog.Root>
        <Dialog.Trigger>Open dialog</Dialog.Trigger>
        <Dialog.Content
          heading="Archive project?"
          description="Archived projects become read-only for all members."
        >
          <div className="flex justify-end gap-3">
            <Dialog.Close variant="secondary">Cancel</Dialog.Close>
            <Dialog.Close variant="default">Archive</Dialog.Close>
          </div>
        </Dialog.Content>
      </Dialog.Root>

      <Dialog.Root>
        <Dialog.Trigger variant="outline">Open primitives</Dialog.Trigger>
        <Dialog.Portal>
          <Dialog.Backdrop />
          <Dialog.Viewport>
            <Dialog.Popup>
              <Dialog.Title>Primitive composition</Dialog.Title>
              <Dialog.Description>
                Use each exported part when custom structure is needed.
              </Dialog.Description>
              <Dialog.Close aria-label="Close dialog" />
            </Dialog.Popup>
          </Dialog.Viewport>
        </Dialog.Portal>
      </Dialog.Root>
    </StorySection>
  );
}
