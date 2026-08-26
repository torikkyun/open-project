import { Button } from "../button";
import { Snackbar } from "../snackbar";
import { StorySection } from "./story-section";

function SnackbarControls() {
  const manager = Snackbar.useManager();

  return (
    <div className="flex flex-wrap gap-3">
      <Button
        onClick={() =>
          manager.add({
            title: "Project saved",
            description: "Website Redesign was updated.",
            type: "success",
          })
        }
      >
        Success
      </Button>
      <Button
        variant="outline"
        onClick={() =>
          manager.add({
            title: "Could not save project",
            description: "Check your connection and try again.",
            type: "error",
            priority: "high",
          })
        }
      >
        Error
      </Button>
      <Button
        variant="secondary"
        onClick={() => {
          const id = manager.add({
            title: "Member removed",
            description: "Bao Le no longer has workspace access.",
            timeout: 10000,
            actionProps: {
              children: "Undo",
              onClick: () => manager.close(id),
            },
          });
        }}
      >
        With action
      </Button>
    </div>
  );
}

export function SnackbarStories() {
  return (
    <StorySection
      id="snackbar"
      title="Snackbar"
      description="Toast-backed status feedback with stacking, actions, announcements, and swipe dismissal."
    >
      <Snackbar.Provider timeout={5000} limit={3}>
        <SnackbarControls />
      </Snackbar.Provider>
    </StorySection>
  );
}
