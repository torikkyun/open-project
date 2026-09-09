import { useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { projectsEndpoints } from "../../api/endpoints/projects";
import { tasksEndpoints } from "../../api/endpoints/tasks";
import { usersEndpoints } from "../../api/endpoints/users";
import type { Project, ProjectMember, Task, User } from "../../api/contracts";
import { Button, Dialog, Input } from "../../components/ui";

const statuses = ["todo", "in_progress", "review", "done", "canceled"] as const;
const statusNames: Record<string, string> = {
  todo: "To do",
  in_progress: "In progress",
  review: "Review",
  done: "Done",
  canceled: "Canceled",
};

function dateLabel(value?: string) {
  return value
    ? new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(
        new Date(value),
      )
    : "-";
}

function TaskDialog({
  open,
  project,
  task,
  tasks,
  users,
  onClose,
  onSaved,
}: {
  open: boolean;
  project: Project;
  task: Task | null;
  tasks: Task[];
  users: User[];
  onClose: () => void;
  onSaved: (task: Task) => void;
}) {
  const [form, setForm] = useState({
    title: "",
    description: "",
    start_date: project.start_date.slice(0, 10),
    end_date: project.end_date.slice(0, 10),
    priority: "medium",
    estimated_hours: "",
    assignee_id: "",
    parent_task_id: "",
  });
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setForm({
      title: task?.title ?? "",
      description: task?.description ?? "",
      start_date:
        task?.start_date.slice(0, 10) ?? project.start_date.slice(0, 10),
      end_date: task?.end_date.slice(0, 10) ?? project.end_date.slice(0, 10),
      priority: task?.priority ?? "medium",
      estimated_hours: task?.estimated_hours?.toString() ?? "",
      assignee_id: task?.assignees?.[0]?.id ?? "",
      parent_task_id: task?.parent_task_id ?? "",
    });
    setError(null);
  }, [open, project, task]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      const payload = {
        title: form.title,
        description: form.description,
        start_date: form.start_date,
        end_date: form.end_date,
        priority: form.priority as Task["priority"],
        estimated_hours: form.estimated_hours
          ? Number(form.estimated_hours)
          : undefined,
        assignee_ids: form.assignee_id ? [form.assignee_id] : [],
        parent_task_id: form.parent_task_id || undefined,
      };
      const result = task
        ? await tasksEndpoints.update(task.id, payload)
        : await tasksEndpoints.create(project.id, payload);
      onSaved(result);
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : "Unable to save task");
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
            <Dialog.Title>{task ? "Edit task" : "Create task"}</Dialog.Title>
            <Dialog.Description>
              Set schedule, hierarchy, priority, and assignee.
            </Dialog.Description>
            <form className="space-y-md" onSubmit={submit}>
              <label className="block text-body-sm" htmlFor="task-title">
                Title
                <Input
                  id="task-title"
                  required
                  value={form.title}
                  onChange={(event) =>
                    setForm({ ...form, title: event.target.value })
                  }
                />
              </label>
              <label className="block text-body-sm" htmlFor="task-description">
                Description
                <textarea
                  id="task-description"
                  className="mt-xs min-h-20 w-full border border-hairline bg-surface-1 p-sm"
                  value={form.description}
                  onChange={(event) =>
                    setForm({ ...form, description: event.target.value })
                  }
                />
              </label>
              <div className="grid gap-md sm:grid-cols-2">
                <label className="block text-body-sm" htmlFor="task-start">
                  Start
                  <input
                    id="task-start"
                    className="mt-xs min-h-12 w-full border-b border-hairline-strong bg-surface-1 px-sm"
                    required
                    type="date"
                    value={form.start_date}
                    onChange={(event) =>
                      setForm({ ...form, start_date: event.target.value })
                    }
                  />
                </label>
                <label className="block text-body-sm" htmlFor="task-end">
                  End
                  <input
                    id="task-end"
                    className="mt-xs min-h-12 w-full border-b border-hairline-strong bg-surface-1 px-sm"
                    required
                    type="date"
                    value={form.end_date}
                    onChange={(event) =>
                      setForm({ ...form, end_date: event.target.value })
                    }
                  />
                </label>
              </div>
              <div className="grid gap-md sm:grid-cols-2">
                <label className="block text-body-sm" htmlFor="task-priority">
                  Priority
                  <select
                    id="task-priority"
                    className="mt-xs min-h-12 w-full border-b border-hairline-strong bg-surface-1 px-sm"
                    value={form.priority}
                    onChange={(event) =>
                      setForm({ ...form, priority: event.target.value })
                    }
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </label>
                <label className="block text-body-sm" htmlFor="task-hours">
                  Estimated hours
                  <Input
                    id="task-hours"
                    min="0"
                    step="0.5"
                    type="number"
                    value={form.estimated_hours}
                    onChange={(event) =>
                      setForm({ ...form, estimated_hours: event.target.value })
                    }
                  />
                </label>
              </div>
              <div className="grid gap-md sm:grid-cols-2">
                <label className="block text-body-sm" htmlFor="task-assignee">
                  Assignee
                  <select
                    id="task-assignee"
                    className="mt-xs min-h-12 w-full border-b border-hairline-strong bg-surface-1 px-sm"
                    value={form.assignee_id}
                    onChange={(event) =>
                      setForm({ ...form, assignee_id: event.target.value })
                    }
                  >
                    <option value="">Unassigned</option>
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block text-body-sm" htmlFor="task-parent">
                  Parent task
                  <select
                    id="task-parent"
                    className="mt-xs min-h-12 w-full border-b border-hairline-strong bg-surface-1 px-sm"
                    value={form.parent_task_id}
                    onChange={(event) =>
                      setForm({ ...form, parent_task_id: event.target.value })
                    }
                  >
                    <option value="">Top level</option>
                    {tasks
                      .filter((item) => item.id !== task?.id)
                      .map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.title}
                        </option>
                      ))}
                  </select>
                </label>
              </div>
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
                  {pending ? "Saving..." : "Save task"}
                </Button>
              </div>
            </form>
          </Dialog.Popup>
        </Dialog.Viewport>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function TaskList({
  tasks,
  users,
  onCreate,
  onEdit,
  onUpdate,
}: {
  tasks: Task[];
  users: User[];
  onCreate: () => void;
  onEdit: (task: Task) => void;
  onUpdate: (id: string, payload: Partial<Task>) => Promise<void>;
}) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [assigneeId, setAssigneeId] = useState("");
  const roots = tasks.filter((task) => !task.parent_task_id);
  const children = (parentId: string) =>
    tasks.filter((task) => task.parent_task_id === parentId);
  const filtered = tasks.filter(
    (task) =>
      !search || task.title.toLowerCase().includes(search.toLowerCase()),
  );
  const visible = (task: Task) =>
    filtered.includes(task) &&
    (!status || task.status === status) &&
    (!assigneeId ||
      task.assignees?.some((assignee) => assignee.id === assigneeId));
  function rows(parentId?: string, depth = 0): React.ReactNode[] {
    return (parentId ? children(parentId) : roots).flatMap((task) => [
      visible(task) ? (
        <tr key={task.id}>
          <td
            className="p-md"
            style={{ paddingLeft: `${1 + depth * 1.25}rem` }}
          >
            <button
              className="text-left font-semibold text-primary hover:underline"
              onClick={() => onEdit(task)}
            >
              {task.title}
            </button>
            {task.subtasks_count ? (
              <span className="ml-xs text-caption text-ink-muted">
                {task.subtasks_count} subtasks
              </span>
            ) : null}
            <p className="mt-xxs text-caption text-ink-muted">
              {task.assignees?.map((assignee) => assignee.name).join(", ") ||
                "Unassigned"}
            </p>
          </td>
          <td className="p-md">
            <select
              aria-label={`${task.title} status`}
              className="border-b border-hairline-strong bg-surface-1 px-xs py-xxs"
              value={task.status}
              onChange={(event) =>
                void onUpdate(task.id, {
                  status: event.target.value as Task["status"],
                })
              }
            >
              {statuses.map((value) => (
                <option key={value} value={value}>
                  {statusNames[value]}
                </option>
              ))}
            </select>
          </td>
          <td className="p-md">
            <label className="flex items-center gap-xs">
              <input
                aria-label={`${task.title} progress`}
                max="100"
                min="0"
                type="range"
                value={task.progress_percent ?? 0}
                onChange={(event) =>
                  void onUpdate(task.id, {
                    progress_percent: Number(event.target.value),
                  })
                }
              />
              <span>{task.progress_percent ?? 0}%</span>
            </label>
          </td>
          <td className="p-md whitespace-nowrap">
            {dateLabel(task.start_date)} - {dateLabel(task.end_date)}
          </td>
          <td className="p-md">
            {task.estimated_hours ?? 0}h / {task.actual_hours ?? 0}h
          </td>
        </tr>
      ) : null,
      ...rows(task.id, depth + 1),
    ]);
  }
  return (
    <section aria-labelledby="tasks-title" className="space-y-md">
      <div className="flex flex-col gap-md md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-subhead" id="tasks-title">
            Task list
          </h2>
          <p className="mt-xxs text-body-sm text-ink-muted">
            Hierarchical work breakdown with inline updates.
          </p>
        </div>
        <Button onClick={onCreate}>Create task</Button>
      </div>
      <div className="grid gap-md md:grid-cols-[minmax(14rem,1fr)_12rem_14rem]">
        <label className="text-body-sm" htmlFor="task-search">
          Search
          <Input
            id="task-search"
            placeholder="Task title"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </label>
        <label className="text-body-sm" htmlFor="task-status">
          Status
          <select
            id="task-status"
            className="mt-xs min-h-12 w-full border-b border-hairline-strong bg-surface-1 px-md"
            value={status}
            onChange={(event) => setStatus(event.target.value)}
          >
            <option value="">All statuses</option>
            {statuses.map((value) => (
              <option key={value} value={value}>
                {statusNames[value]}
              </option>
            ))}
          </select>
        </label>
        <label className="text-body-sm" htmlFor="task-assignee-filter">
          Assignee
          <select
            id="task-assignee-filter"
            className="mt-xs min-h-12 w-full border-b border-hairline-strong bg-surface-1 px-md"
            value={assigneeId}
            onChange={(event) => setAssigneeId(event.target.value)}
          >
            <option value="">All assignees</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name}
              </option>
            ))}
          </select>
        </label>
      </div>
      {tasks.length ? (
        <div className="overflow-x-auto border border-hairline">
          <table className="w-full min-w-[68rem] text-left text-body-sm">
            <caption className="sr-only">Project task list</caption>
            <thead className="bg-surface-1 text-caption uppercase text-ink-muted">
              <tr>
                <th className="p-md">Task</th>
                <th className="p-md">Status</th>
                <th className="p-md">Progress</th>
                <th className="p-md">Schedule</th>
                <th className="p-md">Hours</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline">{rows()}</tbody>
          </table>
        </div>
      ) : (
        <p className="border border-dashed border-hairline-strong p-xl text-body-sm text-ink-muted">
          No tasks match filters.
        </p>
      )}
    </section>
  );
}

export function ProjectDetailPage() {
  const { projectId } = useParams({
    from: "/_authenticated/projects/$projectId",
  });
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [tab, setTab] = useState<"tasks" | "members">("tasks");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [memberId, setMemberId] = useState("");
  const [taskDialog, setTaskDialog] = useState<{
    open: boolean;
    task: Task | null;
  }>({ open: false, task: null });

  async function loadProject() {
    setProject(await projectsEndpoints.getById(projectId));
  }

  useEffect(() => {
    let active = true;
    setLoading(true);
    Promise.all([
      projectsEndpoints.getById(projectId),
      tasksEndpoints.list(projectId, { limit: 100 }),
      usersEndpoints.list({ limit: 100 }),
    ])
      .then(([projectResult, taskResult, userResult]) => {
        if (active) {
          setProject(projectResult);
          setTasks(taskResult);
          setUsers(userResult);
        }
      })
      .catch(
        (cause: unknown) =>
          active &&
          setError(
            cause instanceof Error ? cause.message : "Unable to load project",
          ),
      )
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [projectId]);

  async function updateTask(id: string, payload: Partial<Task>) {
    try {
      const result = await tasksEndpoints.update(id, payload);
      setTasks((current) =>
        current.map((task) => (task.id === id ? { ...task, ...result } : task)),
      );
    } catch (cause: unknown) {
      setError(
        cause instanceof Error ? cause.message : "Unable to update task",
      );
    }
  }

  async function addMember(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!memberId) return;
    try {
      await projectsEndpoints.addMember(projectId, { user_id: memberId });
      await loadProject();
      setMemberId("");
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : "Unable to add member");
    }
  }

  async function removeMember(member: ProjectMember) {
    try {
      await projectsEndpoints.removeMember(projectId, member.id);
      await loadProject();
    } catch (cause: unknown) {
      setError(
        cause instanceof Error ? cause.message : "Unable to remove member",
      );
    }
  }

  if (loading && !project)
    return (
      <p className="text-body-sm text-ink-muted" role="status">
        Loading project...
      </p>
    );
  if (!project)
    return (
      <p
        className="border border-error p-md text-body-sm text-error"
        role="alert"
      >
        {error ?? "Project not found"}
      </p>
    );
  const members = project.members ?? [];
  const memberIds = new Set(members.map((member) => member.id));
  const availableUsers = users.filter((user) => !memberIds.has(user.id));

  return (
    <section aria-labelledby="project-detail-title" className="space-y-xl">
      <div className="border-b border-hairline pb-lg">
        <p className="text-eyebrow uppercase text-primary">
          Open Project / Workspace
        </p>
        <h1 className="mt-xs text-headline" id="project-detail-title">
          {project.name}
        </h1>
        <p className="mt-xs max-w-[48rem] text-body-sm text-ink-muted">
          {project.description || "No project description."}
        </p>
        <div className="mt-md flex flex-wrap gap-lg text-body-sm text-ink-muted">
          <span>{project.status}</span>
          <span>
            {dateLabel(project.start_date)} - {dateLabel(project.end_date)}
          </span>
          <span>{project.tasks_count ?? tasks.length} tasks</span>
          <span>{members.length} members</span>
        </div>
      </div>
      {error ? (
        <p
          className="border border-error p-md text-body-sm text-error"
          role="alert"
        >
          {error}
        </p>
      ) : null}
      <div className="flex gap-xs border-b border-hairline" role="tablist">
        <button
          className={`border-b-2 px-md py-sm text-body-sm ${tab === "tasks" ? "border-primary text-primary" : "border-transparent text-ink-muted"}`}
          role="tab"
          aria-selected={tab === "tasks"}
          onClick={() => setTab("tasks")}
        >
          Tasks
        </button>
        <button
          className={`border-b-2 px-md py-sm text-body-sm ${tab === "members" ? "border-primary text-primary" : "border-transparent text-ink-muted"}`}
          role="tab"
          aria-selected={tab === "members"}
          onClick={() => setTab("members")}
        >
          Members
        </button>
      </div>
      {tab === "tasks" ? (
        <TaskList
          tasks={tasks}
          users={users}
          onCreate={() => setTaskDialog({ open: true, task: null })}
          onEdit={(task) => setTaskDialog({ open: true, task })}
          onUpdate={updateTask}
        />
      ) : (
        <section aria-labelledby="members-title" className="space-y-md">
          <div className="flex flex-col gap-md md:flex-row md:items-center md:justify-between">
            <h2 className="text-subhead" id="members-title">
              Project members
            </h2>
            <form className="flex gap-xs" onSubmit={addMember}>
              <select
                aria-label="Member to add"
                className="min-h-10 border-b border-hairline-strong bg-surface-1 px-sm text-body-sm"
                value={memberId}
                onChange={(event) => setMemberId(event.target.value)}
              >
                <option value="">Add member...</option>
                {availableUsers.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
              </select>
              <Button size="sm" disabled={!memberId}>
                Add
              </Button>
            </form>
          </div>
          <div className="divide-y divide-hairline border border-hairline">
            {members.map((member) => (
              <div
                className="flex items-center justify-between gap-md p-md"
                key={member.id}
              >
                <div>
                  <p className="text-body-emphasis">{member.name}</p>
                  <p className="text-body-sm text-ink-muted">{member.role}</p>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => void removeMember(member)}
                >
                  Remove
                </Button>
              </div>
            ))}
          </div>
        </section>
      )}
      <TaskDialog
        open={taskDialog.open}
        project={project}
        task={taskDialog.task}
        tasks={tasks}
        users={users}
        onClose={() => setTaskDialog({ open: false, task: null })}
        onSaved={(task) => {
          setTasks((current) =>
            current.some((item) => item.id === task.id)
              ? current.map((item) => (item.id === task.id ? task : item))
              : [task, ...current],
          );
          setTaskDialog({ open: false, task: null });
        }}
      />
    </section>
  );
}
