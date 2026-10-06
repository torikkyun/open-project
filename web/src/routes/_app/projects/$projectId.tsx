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
import { ProjectTaskList } from "@/feat/project/components/project-task-list";
// import { ProjectTaskBoard } from "@/feat/project/components/project-task-board";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/_app/projects/$projectId")({
  component: ProjectPage,
});

const projectTabs = [
  { value: "summary", label: "Tổng quan", icon: LayoutDashboard },
  { value: "list", label: "Danh sách", icon: List },
  { value: "board", label: "Bảng", icon: Columns3 },
  { value: "development", label: "Phát triển", icon: Code2 },
  { value: "form", label: "Biểu mẫu", icon: ClipboardList },
  { value: "timeline", label: "Dòng thời gian", icon: CalendarDays },
  { value: "docs", label: "Tài liệu", icon: FileText },
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
    <main className="flex h-[calc(100svh-3.75rem)] min-h-0 flex-col gap-2 overflow-hidden bg-muted/30 sm:p-2 sm:pb-0 md:h-[calc(100svh-4.25rem)]">
      <div className="shrink-0">
        <h1 className="text-xl font-semibold">{project.name}</h1>
        {project.description && (
          <p className="mt-1 text-sm text-muted-foreground">
            {project.description}
          </p>
        )}
      </div>
      <Tabs defaultValue="summary" className="min-h-0 min-w-0 flex-1">
        <TabsList variant="default" className="shrink-0">
          {projectTabs.map(({ value, label, icon: Icon }) => (
            <TabsTrigger key={value} value={value}>
              <Icon aria-hidden="true" />
              {label}
            </TabsTrigger>
          ))}
        </TabsList>
        {projectTabs.map(({ value }) => (
          <TabsContent
            key={value}
            value={value}
            className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden"
          >
            {value === "list" && (
              <ProjectTaskList
                projectId={project.id}
                projectKey={project.project_key}
              />
            )}
            {/* {value === "board" && <ProjectTaskBoard projectId={project.id} />} */}
          </TabsContent>
        ))}
      </Tabs>
    </main>
  );
}
