import { PriorityDot, StatusTag, UnscheduledTag } from "../../shared";
import { StorySection } from "./story-section";

export function TaskIndicatorsStories() {
  return (
    <StorySection
      id="task-indicators"
      title="Task indicators"
      description="Semantic status, priority, and scheduling labels without a headless primitive."
    >
      <div className="grid gap-6">
        <div className="flex flex-wrap items-center gap-3">
          <StatusTag status="Active" />
          <StatusTag status="Done" />
          <StatusTag status="Paused" />
          <StatusTag status="To Do" />
          <StatusTag status="In Progress" />
          <StatusTag status="Review" />
          <StatusTag status="Pending" />
        </div>
        <div className="flex flex-wrap items-center gap-6">
          <PriorityDot priority="High" />
          <PriorityDot priority="Medium" />
          <PriorityDot priority="Low" />
          <UnscheduledTag />
        </div>
      </div>
    </StorySection>
  );
}
