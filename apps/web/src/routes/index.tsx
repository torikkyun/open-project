import { createFileRoute } from "@tanstack/react-router";
import { AllStories } from "../components/ui/stories";

export const Route = createFileRoute("/")({
  component: AllStories,
});
