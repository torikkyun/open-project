import { useEffect, useMemo, useState } from "react";
import { projectsEndpoints } from "../../api/endpoints/projects";
import { templatesEndpoints } from "../../api/endpoints/templates";
import { usersEndpoints } from "../../api/endpoints/users";
import type { Project, Template, User } from "../../api/contracts";
import { Button, Dialog, Input } from "../../components/ui";
import { ProjectDetailPage as ProjectDetail } from "./project-detail";

const statuses = [
  { value: "", label: "All statuses" },
  { value: "not_started", label: "Not started" },
  { value: "in_progress", label: "In progress" },
  { value: "completed", label: "Completed" },
  { value: "archived", label: "Archived" },
] as const;

type ProjectForm = {
  name: string;
  description: string;
  start_date: string;
  end_date: string;
  template_id: string;
  member_ids: string[];
};

const emptyForm: ProjectForm = {
  name: "",
  description: "",
  start_date: "",
  end_date: "",
  template_id: "",
  member_ids: [],
};

function formatDate(value?: string) {
  return value
    ? new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(
        new Date(value),
      )
    : "-";
}

function statusLabel(status?: string) {
  return statuses.find((item) => item.value === status)?.label ?? status ?? "-";
}

function ProjectFormDialog({
  open,
  project,
  users,
  templates,
  onClose,
  onSaved,
}: {
  open: boolean;
  project: Project | null;
  users: User[];
  templates: Template[];
  onClose: () => void;
  onSaved: (project: Project) => void;
}) {
  const [form, setForm] = useState(emptyForm);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setForm(
      project
        ? {
            name: project.name,
            description: project.description ?? "",
            start_date: project.start_date.slice(0, 10),
            end_date: project.end_date.slice(0, 10),
            template_id: project.template_id ?? "",
            member_ids: [],
          }
        : emptyForm,
    );
    setError(null);
  }, [project, open]);

  function update<K extends keyof ProjectForm>(key: K, value: ProjectForm[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      const result = project
        ? await projectsEndpoints.update(project.id, {
            name: form.name,
            description: form.description,
            start_date: form.start_date,
            end_date: form.end_date,
          })
        : await projectsEndpoints.create({
            ...form,
            template_id: form.template_id || undefined,
          });
      onSaved(result);
      onClose();
    } catch (cause: unknown) {
      setError(
        cause instanceof Error ? cause.message : "Unable to save project",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(nextOpen) => !nextOpen && onClose()}
    >
      <Dialog.Portal>
        <Dialog.Backdrop />
        <Dialog.Viewport>
          <Dialog.Popup>
            <Dialog.Title>
              {project ? "Edit project" : "Create project"}
            </Dialog.Title>
            <Dialog.Description>
              Set project dates, template, and initial members.
            </Dialog.Description>
            <form className="space-y-md" onSubmit={submit}>
              <label className="block text-body-sm" htmlFor="project-name">
                Name
                <Input
                  id="project-name"
                  required
                  value={form.name}
                  onChange={(event) => update("name", event.target.value)}
                />
              </label>
              <label
                className="block text-body-sm"
                htmlFor="project-description"
              >
                Description
                <textarea
                  id="project-description"
                  className="mt-xs min-h-24 w-full border border-hairline bg-surface-1 p-sm"
                  value={form.description}
                  onChange={(event) =>
                    update("description", event.target.value)
                  }
                />
              </label>
              <div className="grid gap-md sm:grid-cols-2">
                <label className="block text-body-sm" htmlFor="project-start">
                  Start date
                  <input
                    id="project-start"
                    className="mt-xs min-h-12 w-full border-b border-hairline-strong bg-surface-1 px-md"
                    required
                    type="date"
                    value={form.start_date}
                    onChange={(event) =>
                      update("start_date", event.target.value)
                    }
                  />
                </label>
                <label className="block text-body-sm" htmlFor="project-end">
                  End date
                  <input
                    id="project-end"
                    className="mt-xs min-h-12 w-full border-b border-hairline-strong bg-surface-1 px-md"
                    required
                    type="date"
                    value={form.end_date}
                    onChange={(event) => update("end_date", event.target.value)}
                  />
                </label>
              </div>
              {!project ? (
                <>
                  <label
                    className="block text-body-sm"
                    htmlFor="project-template"
                  >
                    Template
                    <select
                      id="project-template"
                      className="mt-xs min-h-12 w-full border-b border-hairline-strong bg-surface-1 px-md"
                      value={form.template_id}
                      onChange={(event) =>
                        update("template_id", event.target.value)
                      }
                    >
                      <option value="">No template</option>
                      {templates.map((template) => (
                        <option key={template.id} value={template.id}>
                          {template.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <fieldset>
                    <legend className="text-body-sm">Initial members</legend>
                    <div className="mt-xs grid max-h-32 gap-xs overflow-auto border border-hairline p-sm">
                      {users.map((user) => (
                        <label
                          className="flex items-center gap-xs text-body-sm"
                          key={user.id}
                        >
                          <input
                            type="checkbox"
                            checked={form.member_ids.includes(user.id)}
                            onChange={(event) =>
                              update(
                                "member_ids",
                                event.target.checked
                                  ? [...form.member_ids, user.id]
                                  : form.member_ids.filter(
                                      (id) => id !== user.id,
                                    ),
                              )
                            }
                          />
                          {user.name}{" "}
                          <span className="text-ink-muted">({user.email})</span>
                        </label>
                      ))}
                    </div>
                  </fieldset>
                </>
              ) : null}
              {error ? (
                <p
                  className="border border-error p-sm text-body-sm text-error"
                  role="alert"
                >
                  {error}
                </p>
              ) : null}
              <div className="flex justify-end gap-xs">
                <Button type="button" variant="ghost" onClick={onClose}>
                  Cancel
                </Button>
                <Button disabled={pending} type="submit">
                  {pending
                    ? "Saving..."
                    : project
                      ? "Save changes"
                      : "Create project"}
                </Button>
              </div>
            </form>
          </Dialog.Popup>
        </Dialog.Viewport>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [managerId, setManagerId] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialog, setDialog] = useState<{
    open: boolean;
    project: Project | null;
  }>({ open: false, project: null });
  const pageSize = 10;

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    projectsEndpoints
      .list({
        limit: 100,
        search: search || undefined,
        status: status || undefined,
        manager_id: managerId || undefined,
      })
      .then((result) => active && setProjects(result))
      .catch(
        (cause: unknown) =>
          active &&
          setError(
            cause instanceof Error ? cause.message : "Unable to load projects",
          ),
      )
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [managerId, search, status]);

  useEffect(() => {
    Promise.all([
      usersEndpoints.list({ limit: 100 }),
      templatesEndpoints.list({ limit: 100 }),
    ])
      .then(([userResult, templateResult]) => {
        setUsers(userResult as unknown as User[]);
        setTemplates(templateResult as unknown as Template[]);
      })
      .catch(() => undefined);
  }, []);

  const pageCount = Math.max(1, Math.ceil(projects.length / pageSize));
  const visibleProjects = useMemo(
    () => projects.slice((page - 1) * pageSize, page * pageSize),
    [page, projects],
  );
  const managers = users.filter(
    (user) => user.role === "admin" || user.role === "project_manager",
  );

  function replaceProject(project: Project) {
    setProjects((current) =>
      current.some((item) => item.id === project.id)
        ? current.map((item) =>
            item.id === project.id ? { ...item, ...project } : item,
          )
        : [project, ...current],
    );
  }

  async function archive(project: Project) {
    if (!window.confirm(`Archive ${project.name}?`)) return;
    try {
      await projectsEndpoints.archive(project.id);
      setProjects((current) =>
        current.filter((item) => item.id !== project.id),
      );
    } catch (cause: unknown) {
      setError(
        cause instanceof Error ? cause.message : "Unable to archive project",
      );
    }
  }

  return (
    <section aria-labelledby="projects-title" className="space-y-xl">
      <div className="flex flex-col gap-md border-b border-hairline pb-lg md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-eyebrow uppercase text-primary">
            Open Project / Workspaces
          </p>
          <h1 className="mt-xs text-headline" id="projects-title">
            Projects
          </h1>
          <p className="mt-xs text-body-sm text-ink-muted">
            Search, filter, and manage projects within your access scope.
          </p>
        </div>
        <Button onClick={() => setDialog({ open: true, project: null })}>
          Create project
        </Button>
      </div>
      <div
        className="grid gap-md border-b border-hairline pb-lg md:grid-cols-[minmax(14rem,1fr)_12rem_14rem]"
        role="search"
      >
        <label className="text-body-sm" htmlFor="project-search">
          Search
          <Input
            id="project-search"
            placeholder="Project name"
            value={search}
            onChange={(event) => {
              setPage(1);
              setSearch(event.target.value);
            }}
          />
        </label>
        <label className="text-body-sm" htmlFor="project-status">
          Status
          <select
            id="project-status"
            className="mt-xs min-h-12 w-full border-b border-hairline-strong bg-surface-1 px-md"
            value={status}
            onChange={(event) => {
              setPage(1);
              setStatus(event.target.value);
            }}
          >
            {statuses.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
        <label className="text-body-sm" htmlFor="project-manager">
          Manager
          <select
            id="project-manager"
            className="mt-xs min-h-12 w-full border-b border-hairline-strong bg-surface-1 px-md"
            value={managerId}
            onChange={(event) => {
              setPage(1);
              setManagerId(event.target.value);
            }}
          >
            <option value="">All managers</option>
            {managers.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name}
              </option>
            ))}
          </select>
        </label>
      </div>
      {error ? (
        <p
          className="border border-error p-md text-body-sm text-error"
          role="alert"
        >
          {error}
        </p>
      ) : null}
      {loading ? (
        <p className="text-body-sm text-ink-muted" role="status">
          Loading projects...
        </p>
      ) : null}
      {!loading && !error && !visibleProjects.length ? (
        <p className="border border-dashed border-hairline-strong p-xl text-body-sm text-ink-muted">
          No projects match filters.
        </p>
      ) : null}
      {!loading && visibleProjects.length ? (
        <div className="overflow-x-auto border border-hairline">
          <table className="w-full min-w-[52rem] text-left text-body-sm">
            <caption className="sr-only">Project list</caption>
            <thead className="bg-surface-1 text-caption uppercase text-ink-muted">
              <tr>
                <th className="p-md">Project</th>
                <th className="p-md">Status</th>
                <th className="p-md">Dates</th>
                <th className="p-md">Work</th>
                <th className="p-md text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline">
              {visibleProjects.map((project) => (
                <tr key={project.id}>
                  <td className="p-md">
                    <a
                      className="font-semibold text-primary underline-offset-4 hover:underline"
                      href={`/projects/${project.id}`}
                    >
                      {project.name}
                    </a>
                    <p className="mt-xxs max-w-sm truncate text-ink-muted">
                      {project.description || "No description"}
                    </p>
                  </td>
                  <td className="p-md">{statusLabel(project.status)}</td>
                  <td className="p-md whitespace-nowrap">
                    {formatDate(project.start_date)} -{" "}
                    {formatDate(project.end_date)}
                  </td>
                  <td className="p-md whitespace-nowrap">
                    {project.tasks_count ?? 0} tasks /{" "}
                    {project.members_count ?? 0} members
                  </td>
                  <td className="p-md">
                    <div className="flex justify-end gap-xs">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setDialog({ open: true, project })}
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => void archive(project)}
                      >
                        Archive
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
      <div className="flex items-center justify-between text-body-sm text-ink-muted">
        <span>
          {projects.length} project{projects.length === 1 ? "" : "s"}
        </span>
        <div className="flex items-center gap-xs">
          <Button
            size="sm"
            variant="outline"
            disabled={page === 1}
            onClick={() => setPage((value) => value - 1)}
          >
            Previous
          </Button>
          <span>
            Page {page} / {pageCount}
          </span>
          <Button
            size="sm"
            variant="outline"
            disabled={page >= pageCount}
            onClick={() => setPage((value) => value + 1)}
          >
            Next
          </Button>
        </div>
      </div>
      <ProjectFormDialog
        open={dialog.open}
        project={dialog.project}
        users={users}
        templates={templates}
        onClose={() => setDialog({ open: false, project: null })}
        onSaved={replaceProject}
      />
    </section>
  );
}

export function ProjectDetailPage() {
  return <ProjectDetail />;
}
