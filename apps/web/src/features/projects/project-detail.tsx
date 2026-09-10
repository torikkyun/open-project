import { useParams } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { projectsEndpoints } from "../../api/endpoints/projects";
import { tasksEndpoints } from "../../api/endpoints/tasks";
import { usersEndpoints } from "../../api/endpoints/users";
import { getSessionUserRole } from "../../api/client";
import type { Project, ProjectMember, Task, User } from "../../api/contracts";
import { Button, Dialog, Input } from "../../components/ui";

const statuses = ["todo", "in_progress", "review", "done", "canceled"] as const;
const statusNames: Record<string, string> = {
  todo: "Cần làm",
  in_progress: "Đang thực hiện",
  review: "Chờ duyệt",
  done: "Hoàn thành",
  canceled: "Đã hủy",
};

const roleNames: Record<string, string> = {
  admin: "Quản trị viên",
  project_manager: "Quản lý dự án",
  member: "Thành viên",
  guest: "Khách",
};

function dateLabel(value?: string) {
  return value
    ? new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium" }).format(
        new Date(value),
      )
    : "-";
}

type GanttZoom = "day" | "week" | "month";

function dayValue(value: string) {
  return new Date(`${value.slice(0, 10)}T00:00:00`).getTime();
}

function dateValue(value: number) {
  return new Date(value).toISOString().slice(0, 10);
}

function dayCount(start: string, end: string) {
  return Math.max(
    1,
    Math.round((dayValue(end) - dayValue(start)) / 86400000) + 1,
  );
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
      setError(
        cause instanceof Error ? cause.message : "Không thể lưu công việc",
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
              {task ? "Sửa công việc" : "Tạo công việc"}
            </Dialog.Title>
            <Dialog.Description>
              Thiết lập lịch, cấp bậc, mức độ ưu tiên và người được giao.
            </Dialog.Description>
            <form className="space-y-md" onSubmit={submit}>
              <label className="block text-body-sm" htmlFor="task-title">
                Tiêu đề
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
                Mô tả
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
                  Bắt đầu
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
                  Kết thúc
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
                  Mức độ ưu tiên
                  <select
                    id="task-priority"
                    className="mt-xs min-h-12 w-full border-b border-hairline-strong bg-surface-1 px-sm"
                    value={form.priority}
                    onChange={(event) =>
                      setForm({ ...form, priority: event.target.value })
                    }
                  >
                    <option value="low">Thấp</option>
                    <option value="medium">Trung bình</option>
                    <option value="high">Cao</option>
                    <option value="urgent">Khẩn cấp</option>
                  </select>
                </label>
                <label className="block text-body-sm" htmlFor="task-hours">
                  Số giờ ước tính
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
                  Người được giao
                  <select
                    id="task-assignee"
                    className="mt-xs min-h-12 w-full border-b border-hairline-strong bg-surface-1 px-sm"
                    value={form.assignee_id}
                    onChange={(event) =>
                      setForm({ ...form, assignee_id: event.target.value })
                    }
                  >
                    <option value="">Chưa giao</option>
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block text-body-sm" htmlFor="task-parent">
                  Công việc cha
                  <select
                    id="task-parent"
                    className="mt-xs min-h-12 w-full border-b border-hairline-strong bg-surface-1 px-sm"
                    value={form.parent_task_id}
                    onChange={(event) =>
                      setForm({ ...form, parent_task_id: event.target.value })
                    }
                  >
                    <option value="">Cấp cao nhất</option>
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
                  Hủy
                </Button>
                <Button disabled={pending} type="submit">
                  {pending ? "Đang lưu..." : "Lưu công việc"}
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
                "Chưa giao"}
            </p>
          </td>
          <td className="p-md">
            <select
              aria-label={`${task.title} - trạng thái`}
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
                aria-label={`${task.title} - tiến độ`}
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
            Danh sách công việc
          </h2>
          <p className="mt-xxs text-body-sm text-ink-muted">
            Phân rã công việc theo cấp bậc với cập nhật trực tiếp.
          </p>
        </div>
        <Button onClick={onCreate}>Tạo công việc</Button>
      </div>
      <div className="grid gap-md md:grid-cols-[minmax(14rem,1fr)_12rem_14rem]">
        <label className="text-body-sm" htmlFor="task-search">
          Tìm kiếm
          <Input
            id="task-search"
            placeholder="Tên công việc"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </label>
        <label className="text-body-sm" htmlFor="task-status">
          Trạng thái
          <select
            id="task-status"
            className="mt-xs min-h-12 w-full border-b border-hairline-strong bg-surface-1 px-md"
            value={status}
            onChange={(event) => setStatus(event.target.value)}
          >
            <option value="">Tất cả trạng thái</option>
            {statuses.map((value) => (
              <option key={value} value={value}>
                {statusNames[value]}
              </option>
            ))}
          </select>
        </label>
        <label className="text-body-sm" htmlFor="task-assignee-filter">
          Người được giao
          <select
            id="task-assignee-filter"
            className="mt-xs min-h-12 w-full border-b border-hairline-strong bg-surface-1 px-md"
            value={assigneeId}
            onChange={(event) => setAssigneeId(event.target.value)}
          >
            <option value="">Tất cả người được giao</option>
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
            <caption className="sr-only">Danh sách công việc dự án</caption>
            <thead className="bg-surface-1 text-caption uppercase text-ink-muted">
              <tr>
                <th className="p-md">Công việc</th>
                <th className="p-md">Trạng thái</th>
                <th className="p-md">Tiến độ</th>
                <th className="p-md">Lịch</th>
                <th className="p-md">Số giờ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline">{rows()}</tbody>
          </table>
        </div>
      ) : (
        <p className="border border-dashed border-hairline-strong p-xl text-body-sm text-ink-muted">
          Không có công việc phù hợp với bộ lọc.
        </p>
      )}
    </section>
  );
}

function TaskKanban({
  tasks,
  onEdit,
  onUpdate,
}: {
  tasks: Task[];
  onEdit: (task: Task) => void;
  onUpdate: (id: string, payload: Partial<Task>) => Promise<void>;
}) {
  const role = getSessionUserRole();
  const canDrag = role === "admin" || role === "project_manager";
  const canChangeStatus = role !== "guest";
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [dropStatus, setDropStatus] = useState<Task["status"] | null>(null);

  async function moveTask(task: Task, status: Task["status"]) {
    if (task.status === status || pendingId) return;
    setPendingId(task.id);
    try {
      await onUpdate(task.id, { status });
    } finally {
      setPendingId(null);
    }
  }

  async function drop(status: Task["status"]) {
    const task = tasks.find((item) => item.id === draggedId);
    setDraggedId(null);
    setDropStatus(null);
    if (task) await moveTask(task, status);
  }

  return (
    <section aria-labelledby="kanban-title" className="space-y-md">
      <div>
        <h2 className="text-subhead" id="kanban-title">
          Kanban
        </h2>
        <p className="mt-xxs text-body-sm text-ink-muted">
          Di chuyển công việc qua quy trình. API vẫn kiểm tra quyền khi thay đổi
          trạng thái.
        </p>
      </div>
      <div className="grid gap-md overflow-x-auto pb-sm md:grid-cols-5">
        {statuses.map((status) => {
          const columnTasks = tasks.filter((task) => task.status === status);
          return (
            <div
              className={`min-w-[16rem] border border-hairline bg-surface-1 p-sm ${dropStatus === status ? "border-primary" : ""}`}
              key={status}
              onDragEnter={(event) => {
                event.preventDefault();
                if (canDrag) setDropStatus(status);
              }}
              onDragOver={(event) => {
                if (canDrag) event.preventDefault();
              }}
              onDragLeave={() => setDropStatus(null)}
              onDrop={(event) => {
                event.preventDefault();
                if (canDrag) void drop(status);
              }}
            >
              <div className="flex items-center justify-between gap-sm border-b border-hairline pb-sm">
                <h3 className="text-body-emphasis">{statusNames[status]}</h3>
                <span className="text-caption text-ink-muted">
                  {columnTasks.length}
                </span>
              </div>
              <div className="mt-sm space-y-sm">
                {columnTasks.map((task) => (
                  <article
                    className={`border border-hairline-strong bg-canvas p-sm ${draggedId === task.id ? "opacity-50" : ""}`}
                    draggable={canDrag && pendingId !== task.id}
                    key={task.id}
                    onDragStart={() => canDrag && setDraggedId(task.id)}
                    onDragEnd={() => {
                      setDraggedId(null);
                      setDropStatus(null);
                    }}
                  >
                    <button
                      className="w-full text-left text-body-emphasis text-primary hover:underline"
                      onClick={() => onEdit(task)}
                    >
                      {task.title}
                    </button>
                    <p className="mt-xs text-caption text-ink-muted">
                      {task.assignees
                        ?.map((assignee) => assignee.name)
                        .join(", ") || "Unassigned"}
                    </p>
                    <div className="mt-sm flex items-center justify-between gap-xs text-caption text-ink-muted">
                      <span>{task.progress_percent ?? 0}%</span>
                      <span>{task.estimated_hours ?? 0}h</span>
                    </div>
                    {canChangeStatus ? (
                      <label className="mt-sm block text-caption text-ink-muted">
                        Đổi trạng thái
                        <select
                          aria-label={`${task.title} - trạng thái`}
                          className="mt-xxs min-h-10 w-full border-b border-hairline-strong bg-canvas px-xs"
                          disabled={pendingId === task.id}
                          value={task.status}
                          onChange={(event) =>
                            void moveTask(
                              task,
                              event.target.value as Task["status"],
                            )
                          }
                        >
                          {statuses.map((value) => (
                            <option key={value} value={value}>
                              {statusNames[value]}
                            </option>
                          ))}
                        </select>
                      </label>
                    ) : null}
                  </article>
                ))}
                {!columnTasks.length ? (
                  <p className="border border-dashed border-hairline p-sm text-caption text-ink-muted">
                    Không có công việc
                  </p>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function TaskGantt({
  project,
  tasks,
  onEdit,
  onUpdate,
}: {
  project: Project;
  tasks: Task[];
  onEdit: (task: Task) => void;
  onUpdate: (id: string, payload: Partial<Task>) => Promise<void>;
}) {
  const role = getSessionUserRole();
  const canEditDates = role === "admin" || role === "project_manager";
  const [zoom, setZoom] = useState<GanttZoom>("week");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const projectStart = project.start_date.slice(0, 10);
  const projectEnd = project.end_date.slice(0, 10);
  const totalDays = dayCount(projectStart, projectEnd);
  const unitDays = zoom === "day" ? 1 : zoom === "week" ? 7 : 30;
  const units = Math.ceil(totalDays / unitDays);
  const filtered = tasks.filter(
    (task) =>
      (!search || task.title.toLowerCase().includes(search.toLowerCase())) &&
      (!status || task.status === status),
  );
  const rowIndex = new Map(filtered.map((task, index) => [task.id, index]));

  function taskPosition(task: Task) {
    const start = Math.max(0, dayCount(projectStart, task.start_date) - 1);
    const duration = Math.min(
      totalDays - start,
      dayCount(task.start_date, task.end_date),
    );
    return {
      left: `${(start / totalDays) * 100}%`,
      width: task.is_milestone
        ? "1.25rem"
        : `${Math.max((duration / totalDays) * 100, 1.25)}%`,
    };
  }

  function labels() {
    return Array.from({ length: units }, (_, index) => {
      const date = dayValue(projectStart) + index * unitDays * 86400000;
      return new Intl.DateTimeFormat("vi-VN", {
        month: "short",
        day: zoom === "month" ? undefined : "numeric",
      }).format(new Date(date));
    });
  }

  async function drop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    const task = filtered.find((item) => item.id === draggedId);
    setDraggedId(null);
    if (!task || !canEditDates || !timelineRef.current) return;
    const bounds = timelineRef.current.getBoundingClientRect();
    const chartLeft = bounds.left + 224;
    const chartWidth = bounds.width - 224;
    const ratio = Math.max(
      0,
      Math.min(1, (event.clientX - chartLeft) / chartWidth),
    );
    const duration = dayCount(task.start_date, task.end_date);
    const maxStart = Math.max(0, totalDays - duration);
    const nextStart = Math.min(maxStart, Math.round(ratio * totalDays));
    const start = dayValue(projectStart) + nextStart * 86400000;
    setPendingId(task.id);
    try {
      await onUpdate(task.id, {
        start_date: dateValue(start),
        end_date: dateValue(start + (duration - 1) * 86400000),
      });
    } finally {
      setPendingId(null);
    }
  }

  return (
    <section aria-labelledby="gantt-title" className="space-y-md">
      <div className="flex flex-col gap-md md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-subhead" id="gantt-title">
            Gantt
          </h2>
          <p className="mt-xxs text-body-sm text-ink-muted">
            Lịch, tiến độ, mốc quan trọng và quan hệ phụ thuộc.
          </p>
        </div>
        <div className="flex flex-wrap gap-sm">
          <label className="text-body-sm" htmlFor="gantt-search">
            Tìm kiếm
            <Input
              id="gantt-search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>
          <label className="text-body-sm" htmlFor="gantt-status">
            Trạng thái
            <select
              id="gantt-status"
              className="mt-xs min-h-12 border-b border-hairline-strong bg-surface-1 px-sm"
              value={status}
              onChange={(event) => setStatus(event.target.value)}
            >
              <option value="">Tất cả trạng thái</option>
              {statuses.map((value) => (
                <option key={value} value={value}>
                  {statusNames[value]}
                </option>
              ))}
            </select>
          </label>
          <fieldset
            className="flex items-end gap-xxs"
            aria-label="Mức thu phóng Gantt"
          >
            {(["day", "week", "month"] as const).map((value) => (
              <button
                className={`min-h-12 border px-sm text-body-sm ${zoom === value ? "border-primary text-primary" : "border-hairline-strong"}`}
                key={value}
                onClick={() => setZoom(value)}
                type="button"
              >
                {value}
              </button>
            ))}
          </fieldset>
        </div>
      </div>
      <div className="overflow-x-auto border border-hairline">
        <div
          className="relative min-w-[52rem]"
          ref={timelineRef}
          onDragOver={(event) => canEditDates && event.preventDefault()}
          onDrop={(event) => void drop(event)}
        >
          <div
            className="grid border-b border-hairline bg-surface-1 text-caption text-ink-muted"
            style={{ gridTemplateColumns: "14rem 1fr" }}
          >
            <div className="border-r border-hairline p-sm">Công việc</div>
            <div
              className="grid"
              style={{
                gridTemplateColumns: `repeat(${units}, minmax(4rem, 1fr))`,
              }}
            >
              {labels().map((label, index) => (
                <div
                  className="border-r border-hairline p-sm"
                  key={`${label}-${index}`}
                >
                  {label}
                </div>
              ))}
            </div>
          </div>
          {filtered.map((task) => {
            const position = taskPosition(task);
            return (
              <div
                className="grid min-h-16 border-b border-hairline"
                key={task.id}
                style={{ gridTemplateColumns: "14rem 1fr" }}
              >
                <button
                  className="border-r border-hairline p-sm text-left text-body-sm text-primary hover:underline"
                  onClick={() => onEdit(task)}
                >
                  {task.title}
                  <span className="block text-caption text-ink-muted">
                    {task.progress_percent ?? 0}%
                  </span>
                </button>
                <div className="relative bg-canvas">
                  <div
                    className="absolute inset-0 grid"
                    style={{
                      gridTemplateColumns: `repeat(${units}, minmax(4rem, 1fr))`,
                    }}
                  >
                    {labels().map((_, index) => (
                      <span className="border-r border-hairline" key={index} />
                    ))}
                  </div>
                  <div
                    aria-label={`${task.title}, ${dateLabel(task.start_date)} to ${dateLabel(task.end_date)}`}
                    className={`absolute top-1/2 h-8 -translate-y-1/2 border border-primary bg-blue-60 ${task.is_milestone ? "rotate-45" : ""} ${pendingId === task.id ? "opacity-50" : ""}`}
                    draggable={canEditDates && pendingId !== task.id}
                    onDragStart={() => canEditDates && setDraggedId(task.id)}
                    onDragEnd={() => setDraggedId(null)}
                    style={position}
                    title={`${task.title}: ${task.progress_percent ?? 0}%`}
                  >
                    {!task.is_milestone ? (
                      <span
                        className="block h-full bg-success"
                        style={{ width: `${task.progress_percent ?? 0}%` }}
                      />
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })}
          {filtered.flatMap((task) =>
            (task.dependencies ?? []).flatMap((dependency) => {
              const source = filtered.find((item) => item.id === dependency.id);
              if (!source) return [];
              const sourceRow = rowIndex.get(source.id);
              const targetRow = rowIndex.get(task.id);
              if (sourceRow === undefined || targetRow === undefined) return [];
              const sourcePosition = taskPosition(source);
              const targetPosition = taskPosition(task);
              return (
                <svg
                  aria-hidden="true"
                  className="pointer-events-none absolute left-[14rem] right-0 top-12 h-[calc(100%-3rem)] w-[calc(100%-14rem)]"
                  key={`${dependency.id}-${task.id}`}
                  preserveAspectRatio="none"
                  viewBox={`0 0 100 ${filtered.length * 64}`}
                >
                  <line
                    stroke="currentColor"
                    strokeDasharray="2 2"
                    strokeWidth="0.5"
                    x1={`${parseFloat(sourcePosition.left) + parseFloat(sourcePosition.width)}`}
                    x2={parseFloat(targetPosition.left)}
                    y1={sourceRow * 64 + 32}
                    y2={targetRow * 64 + 32}
                  />
                </svg>
              );
            }),
          )}
          {!filtered.length ? (
            <p className="p-lg text-body-sm text-ink-muted">
              Không có công việc phù hợp với bộ lọc.
            </p>
          ) : null}
        </div>
      </div>
      {!canEditDates ? (
        <p className="text-caption text-ink-muted">
          Chỉ xem. Chỉnh sửa ngày cần quyền Quản trị viên hoặc Quản lý dự án.
        </p>
      ) : null}
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
  const [tab, setTab] = useState<"tasks" | "kanban" | "gantt" | "members">(
    "tasks",
  );
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
    const previous = tasks.find((task) => task.id === id);
    setTasks((current) =>
      current.map((task) => (task.id === id ? { ...task, ...payload } : task)),
    );
    try {
      const result = await tasksEndpoints.update(id, payload);
      setTasks((current) =>
        current.map((task) => (task.id === id ? { ...task, ...result } : task)),
      );
    } catch (cause: unknown) {
      setError(
        cause instanceof Error ? cause.message : "Unable to update task",
      );
      if (previous) {
        setTasks((current) =>
          current.map((task) => (task.id === id ? previous : task)),
        );
      }
      throw cause;
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
          Open Project / Không gian làm việc
        </p>
        <h1 className="mt-xs text-headline" id="project-detail-title">
          {project.name}
        </h1>
        <p className="mt-xs max-w-[48rem] text-body-sm text-ink-muted">
          {project.description || "Chưa có mô tả dự án."}
        </p>
        <div className="mt-md flex flex-wrap gap-lg text-body-sm text-ink-muted">
          <span>{statusNames[project.status] ?? project.status}</span>
          <span>
            {dateLabel(project.start_date)} - {dateLabel(project.end_date)}
          </span>
          <span>{project.tasks_count ?? tasks.length} công việc</span>
          <span>{members.length} thành viên</span>
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
          Công việc
        </button>
        <button
          className={`border-b-2 px-md py-sm text-body-sm ${tab === "kanban" ? "border-primary text-primary" : "border-transparent text-ink-muted"}`}
          role="tab"
          aria-selected={tab === "kanban"}
          onClick={() => setTab("kanban")}
        >
          Kanban
        </button>
        <button
          className={`border-b-2 px-md py-sm text-body-sm ${tab === "gantt" ? "border-primary text-primary" : "border-transparent text-ink-muted"}`}
          role="tab"
          aria-selected={tab === "gantt"}
          onClick={() => setTab("gantt")}
        >
          Gantt
        </button>
        <button
          className={`border-b-2 px-md py-sm text-body-sm ${tab === "members" ? "border-primary text-primary" : "border-transparent text-ink-muted"}`}
          role="tab"
          aria-selected={tab === "members"}
          onClick={() => setTab("members")}
        >
          Thành viên
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
      ) : tab === "kanban" ? (
        <TaskKanban
          tasks={tasks}
          onEdit={(task) => setTaskDialog({ open: true, task })}
          onUpdate={updateTask}
        />
      ) : tab === "gantt" ? (
        <TaskGantt
          project={project}
          tasks={tasks}
          onEdit={(task) => setTaskDialog({ open: true, task })}
          onUpdate={updateTask}
        />
      ) : (
        <section aria-labelledby="members-title" className="space-y-md">
          <div className="flex flex-col gap-md md:flex-row md:items-center md:justify-between">
            <h2 className="text-subhead" id="members-title">
              Thành viên dự án
            </h2>
            <form className="flex gap-xs" onSubmit={addMember}>
              <select
                aria-label="Thành viên cần thêm"
                className="min-h-10 border-b border-hairline-strong bg-surface-1 px-sm text-body-sm"
                value={memberId}
                onChange={(event) => setMemberId(event.target.value)}
              >
                <option value="">Thêm thành viên...</option>
                {availableUsers.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
              </select>
              <Button size="sm" disabled={!memberId}>
                Thêm
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
                  <p className="text-body-sm text-ink-muted">
                    {roleNames[member.role] ?? member.role}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => void removeMember(member)}
                >
                  Xóa
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
