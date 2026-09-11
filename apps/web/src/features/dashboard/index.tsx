import { useEffect, useState } from "react";
import { notificationsEndpoints } from "../../api/endpoints/notifications";
import { projectsEndpoints } from "../../api/endpoints/projects";
import { reportsEndpoints } from "../../api/endpoints/reports";
import type {
  DashboardSummary,
  Notification,
  Project,
} from "../../api/contracts";
import {
  Alert,
  AlertDescription,
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  Progress,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Skeleton,
} from "../../components/ui";

type Scope = "all" | "mine";

const emptySummary: DashboardSummary = {
  projects: { total: 0, by_status: {} },
  tasks: {
    total: 0,
    by_status: {},
    backlog: 0,
    overdue: 0,
    needing_review: 0,
    assigned_to_me: 0,
  },
  progress_percent: 0,
  hours: { estimated: 0, actual: 0 },
  sla: { overdue_tasks: 0 },
  generated_at: "",
};

function Metric({
  label,
  value,
  detail,
}: {
  label: string;
  value: string | number;
  detail?: string;
}) {
  return (
    <Card size="sm">
      <CardHeader>
        <CardDescription>{label}</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-semibold tabular-nums">{value}</p>
        {detail ? <p className="mt-1 text-muted-foreground">{detail}</p> : null}
      </CardContent>
    </Card>
  );
}

export function DashboardPage() {
  const [summary, setSummary] = useState(emptySummary);
  const [projects, setProjects] = useState<Project[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [scope, setScope] = useState<Scope>("all");
  const [projectId, setProjectId] = useState("");
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    Promise.all([
      reportsEndpoints.dashboard({ scope, project_id: projectId || undefined }),
      projectsEndpoints.list({ limit: 100 }),
      notificationsEndpoints.list({ limit: 5 }),
    ])
      .then(([dashboard, projectList, notificationList]) => {
        if (!active) return;
        setSummary(dashboard);
        setProjects(projectList);
        setNotifications(notificationList);
      })
      .catch((cause: unknown) => {
        if (active)
          setError(
            cause instanceof Error ? cause.message : "Không thể tải tổng quan",
          );
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [projectId, scope]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      notificationsEndpoints
        .list({ limit: 5 })
        .then((result) => setNotifications(result))
        .catch(() => undefined);
    }, 30_000);
    return () => window.clearInterval(timer);
  }, []);

  async function exportReport() {
    setExporting(true);
    setError(null);
    try {
      const blob = await reportsEndpoints.exportTasksCsv({
        scope,
        project_id: projectId || undefined,
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "task-report.csv";
      link.click();
      URL.revokeObjectURL(url);
    } catch (cause: unknown) {
      setError(
        cause instanceof Error ? cause.message : "Không thể xuất báo cáo",
      );
    } finally {
      setExporting(false);
    }
  }

  return (
    <section aria-labelledby="dashboard-title" className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 border-b pb-6 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0 flex-1">
          <h1
            className="text-3xl font-semibold tracking-tight"
            id="dashboard-title"
          >
            Tổng quan
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Tình trạng dự án, khối lượng công việc và các việc cần chú ý.
          </p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:flex-row md:w-auto md:shrink-0">
          <Select
            items={[
              { value: "all", label: "Công việc được phép xem" },
              { value: "mine", label: "Công việc được giao cho tôi" },
            ]}
            value={scope}
            onValueChange={(value) => setScope(value as Scope)}
          >
            <SelectTrigger
              className="w-full sm:w-56"
              aria-label="Phạm vi tổng quan"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Công việc được phép xem</SelectItem>
              <SelectItem value="mine">Công việc được giao cho tôi</SelectItem>
            </SelectContent>
          </Select>
          <Combobox
            items={[
              { value: "", label: "Tất cả dự án" },
              ...projects.map((project) => ({
                value: project.id,
                label: project.name,
              })),
            ]}
            value={projectId}
            itemToStringLabel={(value) =>
              value === ""
                ? "Tất cả dự án"
                : (projects.find((project) => project.id === value)?.name ?? "")
            }
            onValueChange={(value) => setProjectId(value as string)}
          >
            <ComboboxInput
              className="w-full sm:w-64"
              placeholder="Tất cả dự án"
              aria-label="Lọc theo dự án"
              showClear
            />
            <ComboboxContent>
              <ComboboxEmpty>Không tìm thấy dự án</ComboboxEmpty>
              <ComboboxList>
                <ComboboxItem value="">Tất cả dự án</ComboboxItem>
                {projects.map((project) => (
                  <ComboboxItem key={project.id} value={project.id}>
                    {project.name}
                  </ComboboxItem>
                ))}
              </ComboboxList>
            </ComboboxContent>
          </Combobox>
          <Button
            className="shrink-0"
            size="sm"
            disabled={exporting}
            type="button"
            onClick={() => void exportReport()}
          >
            {exporting ? "Đang xuất..." : "Xuất CSV"}
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" role="status">
          {Array.from({ length: 4 }, (_, index) => (
            <Card key={index} size="sm">
              <CardHeader>
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-4 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : null}
      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
      {!loading && !error ? (
        <div className="flex flex-col gap-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Metric
              label="Projects"
              value={summary.projects.total}
              detail="Trong phạm vi được phép xem"
            />
            <Metric
              label="Công việc"
              value={summary.tasks.total}
              detail={`${summary.tasks.backlog} trong tồn đọng`}
            />
            <Metric
              label="Tiến độ"
              value={`${Math.round(summary.progress_percent)}%`}
              detail={`${summary.hours.actual} giờ thực tế / ${summary.hours.estimated} giờ ước tính`}
            />
            <Metric
              label="Rủi ro SLA"
              value={summary.sla.overdue_tasks}
              detail="Công việc quá hạn"
            />
          </div>
          <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-4">
                <CardTitle id="workload-title">Khối lượng công việc</CardTitle>
                <CardDescription>
                  {Math.round(summary.progress_percent)}% hoàn thành
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-6">
                <Progress
                  value={Math.min(100, Math.max(0, summary.progress_percent))}
                  aria-label="Tiến độ công việc"
                />
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  <Metric
                    label="Được giao"
                    value={summary.tasks.assigned_to_me}
                  />
                  <Metric
                    label="Chờ duyệt"
                    value={summary.tasks.needing_review}
                  />
                  <Metric label="Tồn đọng" value={summary.tasks.backlog} />
                  <Metric label="Quá hạn" value={summary.tasks.overdue} />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-4">
                <CardTitle id="notifications-title">Thông báo</CardTitle>
                <CardDescription>Cập nhật mỗi 30 giây</CardDescription>
              </CardHeader>
              <CardContent>
                {notifications.length ? (
                  <ul className="flex flex-col divide-y">
                    {notifications.map((notification) => (
                      <li
                        className="flex flex-col gap-1 py-3 first:pt-0 last:pb-0"
                        key={notification.id}
                      >
                        <Badge className="w-fit" variant="secondary">
                          {notification.type}
                        </Badge>
                        <p className="text-sm text-muted-foreground">
                          {notification.content}
                        </p>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Chưa có thông báo mới.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      ) : null}
    </section>
  );
}
