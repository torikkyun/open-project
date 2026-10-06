import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
  CalendarDays,
  ClipboardList,
  Code2,
  Columns3,
  FileText,
  LayoutDashboard,
  List,
} from "lucide-react";

import { api } from "@/api";
import { ProjectTaskList } from "@/components/project-task-list";
import { ProjectTaskBoard } from "@/components/project-task-views";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/_app/projects/$projectId")({
  component: ProjectPage,
});

const projectTabs = [
  { value: "summary", label: "Summary", icon: LayoutDashboard },
  { value: "list", label: "List", icon: List },
  { value: "board", label: "Board", icon: Columns3 },
  { value: "development", label: "Development", icon: Code2 },
  { value: "form", label: "Form", icon: ClipboardList },
  { value: "timeline", label: "Timeline", icon: CalendarDays },
  { value: "docs", label: "Docs", icon: FileText },
] as const;

function ProjectPage() {
  const { projectId } = Route.useParams();
  const projectsQuery = useQuery({
    queryKey: ["projects"],
    queryFn: api.listProjects,
    enabled: typeof window !== "undefined",
  });
  const project = projectsQuery.data?.find((item) => item.id === projectId);

  if (projectsQuery.isPending) {
    return (
      <main className="p-6 text-sm text-muted-foreground">
        Đang tải dự án...
      </main>
    );
  }
  if (projectsQuery.error) {
    return (
      <main className="p-6 text-sm text-destructive" role="alert">
        {projectsQuery.error.message}
      </main>
    );
  }
  if (!project) {
    return (
      <main className="p-6 text-sm text-muted-foreground" role="alert">
        Không tìm thấy dự án.
      </main>
    );
  }

  return (
    <main className="min-h-[calc(100svh-3.75rem)] space-y-5 bg-muted/30 p-4 sm:p-6">
      <div>
        <h1 className="text-xl font-semibold">{project.name}</h1>
        {project.description && (
          <p className="mt-1 text-sm text-muted-foreground">
            {project.description}
          </p>
        )}
      </div>
      <Tabs defaultValue="summary">
        <TabsList variant="default">
          {projectTabs.map(({ value, label, icon: Icon }) => (
            <TabsTrigger key={value} value={value}>
              <Icon aria-hidden="true" />
              {label}
            </TabsTrigger>
          ))}
        </TabsList>
        {projectTabs.map(({ value }) => (
          <TabsContent key={value} value={value} className="min-w-0">
            {value === "list" && (
              <ProjectTaskList
                projectId={project.id}
                projectKey={project.project_key}
              />
            )}
            {value === "board" && <ProjectTaskBoard projectId={project.id} />}
          </TabsContent>
        ))}
      </Tabs>
    </main>
  );
}
