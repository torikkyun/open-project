import { useEffect, useState } from "react";
import { notificationsEndpoints } from "../../api/endpoints/notifications";
import { projectsEndpoints } from "../../api/endpoints/projects";
import { reportsEndpoints } from "../../api/endpoints/reports";
import type {
  DashboardSummary,
  Notification,
  Project,
} from "../../api/contracts";

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
    <article className="border border-hairline bg-canvas p-lg">
      <p className="text-caption uppercase text-ink-muted">{label}</p>
      <p className="mt-xs text-card-title">{value}</p>
      {detail ? (
        <p className="mt-xxs text-body-sm text-ink-muted">{detail}</p>
      ) : null}
    </article>
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
    <section aria-labelledby="dashboard-title" className="space-y-xl">
      <div className="flex flex-col gap-md border-b border-hairline pb-lg md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="mt-xs text-headline" id="dashboard-title">
            Tổng quan
          </h1>
          <p className="mt-xs text-body-sm text-ink-muted">
            Tình trạng dự án, khối lượng công việc và các việc cần chú ý.
          </p>
        </div>
        <div className="flex flex-wrap gap-xs">
          <label className="sr-only" htmlFor="dashboard-scope">
            Phạm vi tổng quan
          </label>
          <select
            id="dashboard-scope"
            className="border border-hairline bg-canvas px-sm py-xs text-body-sm"
            value={scope}
            onChange={(event) => setScope(event.target.value as Scope)}
          >
            <option value="all">Tất cả công việc được phép xem</option>
            <option value="mine">Được giao cho tôi</option>
          </select>
          <label className="sr-only" htmlFor="dashboard-project">
            Lọc theo dự án
          </label>
          <select
            id="dashboard-project"
            className="border border-hairline bg-canvas px-sm py-xs text-body-sm"
            value={projectId}
            onChange={(event) => setProjectId(event.target.value)}
          >
            <option value="">Tất cả dự án</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
          <button
            className="bg-primary px-md py-xs text-button text-on-primary hover:bg-blue-hover disabled:cursor-not-allowed disabled:opacity-50"
            disabled={exporting}
            type="button"
            onClick={() => void exportReport()}
          >
            {exporting ? "Đang xuất..." : "Xuất CSV"}
          </button>
        </div>
      </div>

      {loading ? (
        <p className="text-body-sm text-ink-muted" role="status">
          Đang tải tổng quan...
        </p>
      ) : null}
      {error ? (
        <p
          className="border border-error bg-canvas p-md text-body-sm text-error"
          role="alert"
        >
          {error}
        </p>
      ) : null}
      {!loading && !error ? (
        <>
          <div className="grid gap-px bg-hairline sm:grid-cols-2 xl:grid-cols-4">
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
          <div className="grid gap-xl lg:grid-cols-[1.4fr_1fr]">
            <section
              className="border border-hairline bg-canvas p-lg"
              aria-labelledby="workload-title"
            >
              <div className="flex items-center justify-between gap-md">
                <h2 className="text-subhead" id="workload-title">
                  Khối lượng công việc
                </h2>
                <span className="text-body-sm text-ink-muted">
                  {Math.round(summary.progress_percent)}% hoàn thành
                </span>
              </div>
              <div className="mt-md h-2 bg-surface-2">
                <div
                  className="h-full bg-primary"
                  style={{
                    width: `${Math.min(100, Math.max(0, summary.progress_percent))}%`,
                  }}
                />
              </div>
              <div className="mt-lg grid grid-cols-2 gap-md sm:grid-cols-4">
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
            </section>
            <section
              className="border border-hairline bg-canvas p-lg"
              aria-labelledby="notifications-title"
            >
              <div className="flex items-center justify-between gap-md">
                <h2 className="text-subhead" id="notifications-title">
                  Thông báo
                </h2>
                <span className="text-caption text-ink-muted">
                  Cập nhật mỗi 30 giây
                </span>
              </div>
              {notifications.length ? (
                <ul className="mt-md divide-y divide-hairline">
                  {notifications.map((notification) => (
                    <li className="py-sm" key={notification.id}>
                      <p className="text-body-emphasis">{notification.type}</p>
                      <p className="mt-xxs text-body-sm text-ink-muted">
                        {notification.content}
                      </p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-md text-body-sm text-ink-muted">
                  Chưa có thông báo mới.
                </p>
              )}
            </section>
          </div>
        </>
      ) : null}
    </section>
  );
}
