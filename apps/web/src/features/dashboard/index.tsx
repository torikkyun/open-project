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
            cause instanceof Error ? cause.message : "Unable to load dashboard",
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
        cause instanceof Error ? cause.message : "Unable to export report",
      );
    } finally {
      setExporting(false);
    }
  }

  return (
    <section aria-labelledby="dashboard-title" className="space-y-xl">
      <div className="flex flex-col gap-md border-b border-hairline pb-lg md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-eyebrow uppercase text-primary">
            Open Project / Overview
          </p>
          <h1 className="mt-xs text-headline" id="dashboard-title">
            Dashboard
          </h1>
          <p className="mt-xs text-body-sm text-ink-muted">
            Project health, workload, and work needing attention.
          </p>
        </div>
        <div className="flex flex-wrap gap-xs">
          <label className="sr-only" htmlFor="dashboard-scope">
            Dashboard scope
          </label>
          <select
            id="dashboard-scope"
            className="border border-hairline bg-canvas px-sm py-xs text-body-sm"
            value={scope}
            onChange={(event) => setScope(event.target.value as Scope)}
          >
            <option value="all">All accessible work</option>
            <option value="mine">Assigned to me</option>
          </select>
          <label className="sr-only" htmlFor="dashboard-project">
            Project filter
          </label>
          <select
            id="dashboard-project"
            className="border border-hairline bg-canvas px-sm py-xs text-body-sm"
            value={projectId}
            onChange={(event) => setProjectId(event.target.value)}
          >
            <option value="">All projects</option>
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
            {exporting ? "Exporting..." : "Export CSV"}
          </button>
        </div>
      </div>

      {loading ? (
        <p className="text-body-sm text-ink-muted" role="status">
          Loading dashboard...
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
              detail="Within access scope"
            />
            <Metric
              label="Tasks"
              value={summary.tasks.total}
              detail={`${summary.tasks.backlog} in backlog`}
            />
            <Metric
              label="Progress"
              value={`${Math.round(summary.progress_percent)}%`}
              detail={`${summary.hours.actual}h actual / ${summary.hours.estimated}h estimated`}
            />
            <Metric
              label="SLA risk"
              value={summary.sla.overdue_tasks}
              detail="Overdue tasks"
            />
          </div>
          <div className="grid gap-xl lg:grid-cols-[1.4fr_1fr]">
            <section
              className="border border-hairline bg-canvas p-lg"
              aria-labelledby="workload-title"
            >
              <div className="flex items-center justify-between gap-md">
                <h2 className="text-subhead" id="workload-title">
                  Workload
                </h2>
                <span className="text-body-sm text-ink-muted">
                  {Math.round(summary.progress_percent)}% complete
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
                <Metric label="Assigned" value={summary.tasks.assigned_to_me} />
                <Metric label="Review" value={summary.tasks.needing_review} />
                <Metric label="Backlog" value={summary.tasks.backlog} />
                <Metric label="Overdue" value={summary.tasks.overdue} />
              </div>
            </section>
            <section
              className="border border-hairline bg-canvas p-lg"
              aria-labelledby="notifications-title"
            >
              <div className="flex items-center justify-between gap-md">
                <h2 className="text-subhead" id="notifications-title">
                  Notifications
                </h2>
                <span className="text-caption text-ink-muted">30s polling</span>
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
                  No recent notifications.
                </p>
              )}
            </section>
          </div>
        </>
      ) : null}
    </section>
  );
}
