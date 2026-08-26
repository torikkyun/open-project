import { Tabs } from "../tabs";
import { StorySection } from "./story-section";

export function TabsStories() {
  return (
    <StorySection
      id="tabs"
      title="Tabs"
      description="Active, inactive, disabled, and keyboard navigation states."
    >
      <Tabs.Root className="w-full max-w-[36rem]" defaultValue="overview">
        <Tabs.List activateOnFocus>
          <Tabs.Tab value="overview">Overview</Tabs.Tab>
          <Tabs.Tab value="activity">Activity</Tabs.Tab>
          <Tabs.Tab value="settings">Settings</Tabs.Tab>
          <Tabs.Tab value="billing" disabled>
            Billing
          </Tabs.Tab>
          <Tabs.Indicator />
        </Tabs.List>
        <Tabs.Panel value="overview">
          Project summary and current status.
        </Tabs.Panel>
        <Tabs.Panel value="activity">Latest workspace changes.</Tabs.Panel>
        <Tabs.Panel value="settings">Project configuration.</Tabs.Panel>
        <Tabs.Panel value="billing">Billing is unavailable.</Tabs.Panel>
      </Tabs.Root>
    </StorySection>
  );
}
