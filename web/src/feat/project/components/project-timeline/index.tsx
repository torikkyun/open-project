import {
  Fragment,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { DragDropProvider, DragOverlay } from "@dnd-kit/react";
import { isSortable, useSortable } from "@dnd-kit/react/sortable";
import {
  createColumnHelper,
  rowSelectionFeature,
  tableFeatures,
  useTable,
} from "@tanstack/react-table";
import {
  CalendarDays,
  ChevronRight,
  GripVertical,
  Plus,
  RotateCw,
} from "lucide-react";
import type { Task, TaskStatus, UUID } from "@/api";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { priorities, statuses } from "../../constants/task";
import { ProjectTaskTable } from "../project-task-table";
import { useProjectTasks } from "../project-task-list/hooks";
import { TaskListFilters } from "../project-task-list/task-list-filters";
import type { TaskListContext } from "../project-task-list/types";
import { dateValue, moveTask } from "../project-task-list/utils";
import { QueryMessage } from "../query-message";
import { groupTasks, projectKeyPrefix } from "../../utils/task";

type TimelineScale = "weeks" | "months" | "quarters";

const DAY_MS = 24 * 60 * 60 * 1000;
const scaleOptions: {
  value: TimelineScale;
  label: string;
  dayWidth: number;
}[] = [
  { value: "weeks", label: "Tuần", dayWidth: 40 },
  { value: "months", label: "Tháng", dayWidth: 18 },
  { value: "quarters", label: "Quý", dayWidth: 7 },
];

const taskFeatures = tableFeatures({ rowSelectionFeature });
const columnHelper = createColumnHelper<typeof taskFeatures, Task>();

function utcToday() {
  const now = new Date();
  return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
}

function taskDate(value: string | null) {
  if (!value) return null;
  const day = value.slice(0, 10);
  const date = new Date(`${day}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== day
    ? null
    : date;
}

function startOfPeriod(date: Date, scale: TimelineScale) {
  const start = new Date(date);
  if (scale === "weeks") {
    start.setUTCDate(start.getUTCDate() - ((start.getUTCDay() + 6) % 7));
  } else if (scale === "months") {
    start.setUTCDate(1);
  } else {
    start.setUTCDate(1);
    start.setUTCMonth(Math.floor(start.getUTCMonth() / 3) * 3);
  }
  return start;
}

function addPeriods(date: Date, scale: TimelineScale, count: number) {
  const result = new Date(date);
  if (scale === "weeks") {
    result.setUTCDate(result.getUTCDate() + count * 7);
  } else {
    result.setUTCMonth(
      result.getUTCMonth() + count * (scale === "months" ? 1 : 3),
    );
  }
  return result;
}

function getTimelineDays(tasks: Task[], scale: TimelineScale) {
  const today = utcToday();
  const datedTasks = tasks.flatMap((task) => {
    const start = taskDate(task.start_at);
    const due = taskDate(task.due_at);
    return start && due && due >= start ? [start, due] : [];
  });
  const earliest = datedTasks.reduce(
    (date, next) => (next < date ? next : date),
    today,
  );
  const latest = datedTasks.reduce(
    (date, next) => (next > date ? next : date),
    today,
  );
  const first = addPeriods(startOfPeriod(earliest, scale), scale, -1);
  const end = addPeriods(startOfPeriod(latest, scale), scale, 2);
  const days: Date[] = [];
  for (let time = first.getTime(); time < end.getTime(); time += DAY_MS) {
    days.push(new Date(time));
  }
  return { first, end, days, today };
}

function monthSegments(days: Date[]) {
  const segments: { key: string; label: string; count: number }[] = [];
  for (const day of days) {
    const key = `${day.getUTCFullYear()}-${day.getUTCMonth()}`;
    const previous = segments[segments.length - 1];
    if (previous?.key === key) {
      previous.count += 1;
    } else {
      segments.push({
        key,
        label: day.toLocaleDateString("vi-VN", {
          month: "short",
          year: "numeric",
          timeZone: "UTC",
        }),
        count: 1,
      });
    }
  }
  return segments;
}

function dayLabel(day: Date, scale: TimelineScale) {
  if (scale === "weeks") {
    return day.getUTCDate();
  }
  if (scale === "months" && day.getUTCDay() !== 1 && day.getUTCDate() !== 1) {
    return null;
  }
  if (scale === "quarters" && day.getUTCDate() !== 1) return null;
  return scale === "quarters"
    ? day.toLocaleDateString("vi-VN", {
        month: "short",
        timeZone: "UTC",
      })
    : day.getUTCDate();
}

function dateText(date: Date) {
  return date.toLocaleDateString("vi-VN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

function barClass(status: Task["status"]) {
  if (status === "in_progress") return "bg-primary";
  if (status === "done") return "bg-secondary-foreground/60";
  return "bg-muted-foreground/60";
}

function SortableTimelineRow({
  task,
  index,
  disabled,
  draggedGroup,
  hiddenChild,
  children,
}: {
  task: Task;
  index: number;
  disabled: boolean;
  draggedGroup: boolean;
  hiddenChild: boolean;
  children: (handleRef: (element: Element | null) => void) => ReactNode;
}) {
  const { ref, handleRef, isDragging } = useSortable<{
    parentTaskId: UUID | null;
  }>({
    id: task.id,
    index,
    group: task.parent_task_id ?? "root",
    data: { parentTaskId: task.parent_task_id },
    accept: (source) => source.data.parentTaskId === task.parent_task_id,
    disabled,
  });

  return (
    <TableRow
      ref={ref}
      className="group/task-row h-12 data-[dragging=true]:opacity-40 data-[dragged-group=true]:invisible data-[hidden-child=true]:hidden"
      data-dragging={isDragging}
      data-dragged-group={draggedGroup}
      data-hidden-child={hiddenChild}
    >
      {children(handleRef)}
    </TableRow>
  );
}

export function ProjectTimeline({
  projectId,
  projectKey,
}: {
  projectId: UUID;
  projectKey: string;
}) {
  const [scale, setScale] = useState<TimelineScale>("weeks");
  const [search, setSearch] = useState("");
  const [assigneeFilter, setAssigneeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<"all" | TaskStatus>("all");
  const [collapsedTasks, setCollapsedTasks] = useState<Record<UUID, true>>({});
  const [rowSelection, setRowSelection] = useState<Record<string, true>>({});
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [dragRevision, setDragRevision] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  const taskData = useProjectTasks(projectId);
  const { tasks, membersById } = taskData;

  const taskGroups = useMemo(() => groupTasks(tasks), [tasks]);
  const parentTaskIds = taskGroups.roots
    .filter((task) => taskGroups.children.has(task.id))
    .map((task) => task.id);
  const allTasksCollapsed =
    parentTaskIds.length > 0 &&
    parentTaskIds.every((taskId) => collapsedTasks[taskId]);

  const normalizedSearch = search.trim().toLocaleLowerCase();
  const visibleTasks = useMemo(() => {
    const matches = (task: Task) =>
      (!normalizedSearch ||
        task.title.toLocaleLowerCase().includes(normalizedSearch)) &&
      (statusFilter === "all" || task.status === statusFilter) &&
      (assigneeFilter === "all" ||
        (assigneeFilter === "unassigned"
          ? task.assignee_id === null
          : task.assignee_id === assigneeFilter));
    const result: Task[] = [];
    for (const root of taskGroups.roots) {
      const matchingChildren = (taskGroups.children.get(root.id) ?? []).filter(
        matches,
      );
      if (matches(root) || matchingChildren.length) result.push(root);
      if (
        (matches(root) || matchingChildren.length) &&
        !collapsedTasks[root.id]
      ) {
        result.push(...matchingChildren);
      }
    }
    return result;
  }, [
    taskGroups,
    normalizedSearch,
    statusFilter,
    assigneeFilter,
    collapsedTasks,
  ]);

  const canReorder =
    !normalizedSearch && statusFilter === "all" && assigneeFilter === "all";
  const childrenHidden =
    activeTask !== null && activeTask.parent_task_id === null;
  const displayedRows = childrenHidden
    ? visibleTasks.filter((task) => task.parent_task_id !== activeTask!.id)
    : visibleTasks;

  const timeline = useMemo(() => getTimelineDays(tasks, scale), [tasks, scale]);
  const dayWidth =
    scaleOptions.find((option) => option.value === scale)?.dayWidth ?? 40;
  const timelineWidth = timeline.days.length * dayWidth;
  const firstWeekOffset = timeline.days.findIndex(
    (day) => day.getUTCDay() === 1,
  );
  const gridStyle = {
    backgroundImage:
      "linear-gradient(to right, var(--border) 1px, transparent 1px)",
    backgroundSize: `${dayWidth * 7}px 100%`,
    backgroundPositionX: `${Math.max(0, firstWeekOffset) * dayWidth}px`,
  };
  const keyPrefix = projectKeyPrefix(projectKey);
  const todayOffset = Math.floor(
    (timeline.today.getTime() - timeline.first.getTime()) / DAY_MS,
  );

  function scrollToToday() {
    scrollRef.current
      ?.querySelector<HTMLElement>('[data-slot="table-container"]')
      ?.scrollTo({
        left: Math.max(0, todayOffset * dayWidth),
        behavior: "smooth",
      });
  }

  function toggleAllTasks() {
    if (allTasksCollapsed) {
      setCollapsedTasks({});
      return;
    }
    const collapsed: Record<UUID, true> = {};
    for (const taskId of parentTaskIds) collapsed[taskId] = true;
    setCollapsedTasks(collapsed);
  }

  function startTaskBetween(task: Task, nextTask?: Task) {
    const parentTaskId =
      nextTask?.parent_task_id === task.id
        ? task.id
        : nextTask?.parent_task_id === task.parent_task_id
          ? task.parent_task_id
          : null;
    taskData.setNewTask({
      parentTaskId,
      ...(nextTask &&
      (nextTask.parent_task_id === parentTaskId ||
        nextTask.parent_task_id === task.id)
        ? { insertBeforeTaskId: nextTask.id }
        : {}),
      title: "",
      assigneeId: "",
      reporterId: "",
      priority: "none",
      status: "todo",
      startAt: "",
      dueAt: "",
    });
  }

  function submitNewTask(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    if (!taskData.newTask?.title.trim() || taskData.createPending) return;
    taskData.submitNewTask(taskData.newTask);
  }

  function handleTaskDrop(draggedId: string, targetIndex: number) {
    if (!canReorder) return;
    const draggedTask = tasks.find((task) => task.id === draggedId);
    if (!draggedTask) return;
    const siblings = draggedTask.parent_task_id
      ? (taskGroups.children.get(draggedTask.parent_task_id) ?? [])
      : taskGroups.roots;
    const from = siblings.findIndex((task) => task.id === draggedId);
    if (
      from < 0 ||
      targetIndex < 0 ||
      targetIndex >= siblings.length ||
      from === targetIndex
    ) {
      return;
    }
    taskData.reorderMutation.mutate({
      parent_task_id: draggedTask.parent_task_id,
      task_ids: moveTask(siblings, from, targetIndex).map((task) => task.id),
    });
  }

  function submitQuickTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    taskData.submitQuickTask(taskData.quickCreateTitle);
  }

  const ctxRef = useRef<TaskListContext>(null!);
  ctxRef.current = {
    canReorder,
    collapsedTasks,
    allTasksCollapsed,
    parentTaskIds,
    members: taskData.members,
    membersById: taskData.membersById,
    rowSelection,
    allTasks: tasks,
    visibleTasks,
    children: taskGroups.children,
    titleDrafts: taskData.titleDrafts,
    shortProjectKey: keyPrefix,
    newTask: taskData.newTask,
    quickCreateOpen: taskData.quickCreateOpen,
    reorderPending: taskData.reorderPending,
    setRowSelection,
    setCollapsedTasks,
    setTitleDrafts: taskData.setTitleDrafts,
    setNewTask: taskData.setNewTask,
    updateTask: taskData.updateTask,
    toggleAllTasks,
    childrenHidden,
  };

  const columns = useMemo(
    () =>
      columnHelper.columns([
        columnHelper.display({
          id: "select",
          header: () => {
            const c = ctxRef.current;
            const selectedCount = c.allTasks.filter(
              (task) => c.rowSelection[task.id],
            ).length;
            return (
              <div className="flex items-center gap-1.5">
                <span className="size-4" />
                <Checkbox
                  aria-label="Chọn tất cả công việc"
                  checked={
                    c.allTasks.length > 0 && selectedCount === c.allTasks.length
                  }
                  indeterminate={
                    selectedCount > 0 && selectedCount < c.allTasks.length
                  }
                  onCheckedChange={(checked) => {
                    c.setRowSelection((selected) => {
                      if (!checked) return {};
                      const next = { ...selected };
                      for (const task of c.allTasks) next[task.id] = true;
                      return next;
                    });
                  }}
                />
              </div>
            );
          },
          cell: ({ row }) => {
            const c = ctxRef.current;
            const task = row.original;
            return (
              <Checkbox
                aria-label={`Chọn ${task.title}`}
                checked={Boolean(c.rowSelection[task.id])}
                onCheckedChange={(checked) =>
                  c.setRowSelection((selected) => {
                    const next = { ...selected };
                    if (checked) next[task.id] = true;
                    else delete next[task.id];
                    return next;
                  })
                }
              />
            );
          },
        }),
        columnHelper.display({
          id: "work",
          header: () => {
            const c = ctxRef.current;
            const allCollapsed = c.childrenHidden || c.allTasksCollapsed;
            return (
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  aria-label={
                    allCollapsed
                      ? "Mở rộng tất cả công việc"
                      : "Thu gọn tất cả công việc"
                  }
                  title={allCollapsed ? "Mở rộng tất cả" : "Thu gọn tất cả"}
                  disabled={!c.parentTaskIds.length || c.childrenHidden}
                  onClick={c.toggleAllTasks}
                >
                  <ChevronRight className={allCollapsed ? "" : "rotate-90"} />
                </Button>
                Công việc
              </div>
            );
          },
          cell: ({ row }) => {
            const c = ctxRef.current;
            const task = row.original;
            const depth = task.parent_task_id ? 1 : 0;
            const hasChildren = (c.children.get(task.id)?.length ?? 0) > 0;
            const isCollapsed =
              c.childrenHidden || Boolean(c.collapsedTasks[task.id]);
            return (
              <div className="flex min-w-[24rem] max-w-[40rem] items-center gap-2">
                {depth ? (
                  <span className="ml-6 size-6 shrink-0" />
                ) : hasChildren ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    aria-label={`${c.collapsedTasks[task.id] ? "Mở rộng" : "Thu gọn"} công việc con của ${task.title}`}
                    title={isCollapsed ? "Mở rộng" : "Thu gọn"}
                    onClick={() =>
                      c.setCollapsedTasks((collapsed) => {
                        const next = { ...collapsed };
                        if (next[task.id]) delete next[task.id];
                        else next[task.id] = true;
                        return next;
                      })
                    }
                  >
                    <ChevronRight
                      className={`transition-transform ${isCollapsed ? "" : "rotate-90"}`}
                    />
                  </Button>
                ) : (
                  <span className="size-6 shrink-0" />
                )}
                <span className="shrink-0 whitespace-nowrap text-primary">
                  {c.shortProjectKey.toUpperCase()}-{task.task_number}
                </span>
                <Input
                  value={c.titleDrafts[task.id] ?? task.title}
                  aria-label={`Tiêu đề ${task.title}`}
                  className="min-w-0 flex-1 truncate border-transparent bg-transparent shadow-none hover:border-input focus-visible:border-ring"
                  onChange={(event) =>
                    c.setTitleDrafts((drafts) => ({
                      ...drafts,
                      [task.id]: event.target.value,
                    }))
                  }
                  onKeyDown={(event) => {
                    if (event.key === "Enter") event.currentTarget.blur();
                    if (event.key === "Escape") {
                      c.setTitleDrafts((drafts) => ({
                        ...drafts,
                        [task.id]: task.title,
                      }));
                    }
                  }}
                  onBlur={(event) => {
                    const title = event.currentTarget.value.trim();
                    if (title && title !== task.title) {
                      c.updateTask(task.id, { title });
                    } else {
                      c.setTitleDrafts((drafts) => {
                        const next = { ...drafts };
                        delete next[task.id];
                        return next;
                      });
                    }
                  }}
                />
                {depth === 0 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    disabled={c.newTask !== null || c.quickCreateOpen}
                    aria-label={`Tạo công việc con cho ${task.title}`}
                    title="Tạo công việc con"
                    className="opacity-0 transition-opacity group-hover/task-row:opacity-100 focus-visible:opacity-100"
                    onClick={() =>
                      c.setNewTask({
                        parentTaskId: task.id,
                        title: "",
                        assigneeId: "",
                        reporterId: "",
                        priority: "none",
                        status: "todo",
                        startAt: "",
                        dueAt: "",
                      })
                    }
                  >
                    <Plus />
                  </Button>
                )}
              </div>
            );
          },
        }),
        columnHelper.display({
          id: "assignee",
          header: "Người thực hiện",
          cell: ({ row }) => {
            const c = ctxRef.current;
            const task = row.original;
            return (
              <Combobox
                items={["", ...c.members.map((member) => member.id)]}
                value={task.assignee_id ?? ""}
                itemToStringLabel={(id) =>
                  c.membersById.get(id)?.full_name ?? "Chưa phân công"
                }
                autoHighlight
                onValueChange={(assigneeId) =>
                  c.updateTask(task.id, {
                    assignee_id: assigneeId || null,
                  })
                }
              >
                <ComboboxInput
                  aria-label={`Người thực hiện ${task.title}`}
                  placeholder="Chưa phân công"
                  className="w-40"
                  showClear
                />
                <ComboboxContent>
                  <ComboboxEmpty>Không tìm thấy người phù hợp.</ComboboxEmpty>
                  <ComboboxList>
                    <ComboboxItem value="">Chưa phân công</ComboboxItem>
                    {c.members.map((member) => (
                      <ComboboxItem key={member.id} value={member.id}>
                        {member.full_name}
                      </ComboboxItem>
                    ))}
                  </ComboboxList>
                </ComboboxContent>
              </Combobox>
            );
          },
        }),
        columnHelper.display({
          id: "priority",
          header: "Độ ưu tiên",
          cell: ({ row }) => {
            const c = ctxRef.current;
            return (
              <Combobox
                items={priorities.map((item) => item.value)}
                value={row.original.priority}
                itemToStringLabel={(value) =>
                  priorities.find((item) => item.value === value)?.label ?? ""
                }
                autoHighlight
                onValueChange={(priority) =>
                  priority && c.updateTask(row.original.id, { priority })
                }
              >
                <ComboboxInput
                  aria-label={`Độ ưu tiên ${row.original.title}`}
                  className="w-36"
                />
                <ComboboxContent>
                  <ComboboxEmpty>Không tìm thấy mức ưu tiên.</ComboboxEmpty>
                  <ComboboxList>
                    {priorities.map((item) => (
                      <ComboboxItem key={item.value} value={item.value}>
                        {item.label}
                      </ComboboxItem>
                    ))}
                  </ComboboxList>
                </ComboboxContent>
              </Combobox>
            );
          },
        }),
        columnHelper.display({
          id: "status",
          header: "Trạng thái",
          cell: ({ row }) => {
            const c = ctxRef.current;
            return (
              <Combobox
                items={statuses.map((item) => item.value)}
                value={row.original.status}
                itemToStringLabel={(value) =>
                  statuses.find((item) => item.value === value)?.label ?? ""
                }
                autoHighlight
                onValueChange={(status) =>
                  status && c.updateTask(row.original.id, { status })
                }
              >
                <ComboboxInput
                  aria-label={`Trạng thái ${row.original.title}`}
                  className="w-40"
                />
                <ComboboxContent>
                  <ComboboxEmpty>Không tìm thấy trạng thái.</ComboboxEmpty>
                  <ComboboxList>
                    {statuses.map((item) => (
                      <ComboboxItem key={item.value} value={item.value}>
                        {item.label}
                      </ComboboxItem>
                    ))}
                  </ComboboxList>
                </ComboboxContent>
              </Combobox>
            );
          },
        }),
      ]),
    [],
  );

  const table = useTable({
    features: taskFeatures,
    data: visibleTasks,
    columns,
    getRowId: (task) => task.id,
    state: { rowSelection },
    onRowSelectionChange: setRowSelection,
  });
  const tableOrderKey = visibleTasks.map((task) => task.id).join(",");
  const headerRows = table.getHeaderGroups().map((group) => ({
    id: group.id,
    cells: group.headers.map((header) => ({
      id: header.id,
      content: header.isPlaceholder ? null : (
        <table.FlexRender header={header} />
      ),
    })),
  }));

  const newTaskRow = taskData.newTask && (
    <TableRow className="h-12 bg-muted/40">
      <TableCell className="sticky left-0 z-20 bg-muted/40" />
      <TableCell className="sticky left-[3.25rem] z-10 min-w-[24rem] bg-muted/40">
        <div className="flex min-w-0 items-center gap-2">
          {taskData.newTask.parentTaskId ? (
            <span className="ml-6 size-6 shrink-0" />
          ) : (
            <span className="size-6 shrink-0" />
          )}
          <Input
            autoFocus
            value={taskData.newTask.title}
            onChange={(event) =>
              taskData.setNewTask({
                ...taskData.newTask!,
                title: event.target.value,
              })
            }
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                const today = new Date().toISOString().split("T")[0];
                taskData.setNewTask({
                  ...taskData.newTask!,
                  startAt: today,
                });
                setTimeout(() => submitNewTask(), 0);
              }
              if (event.key === "Escape") taskData.setNewTask(null);
            }}
            placeholder="Nhập tên công việc và nhấn Enter để tạo"
            aria-label="Tiêu đề công việc mới"
            maxLength={200}
            className="min-w-0 flex-1"
          />
          <Button
            type="button"
            size="sm"
            className="shrink-0"
            disabled={!taskData.newTask.title.trim() || taskData.createPending}
            onClick={() => {
              const today = new Date().toISOString().split("T")[0];
              taskData.setNewTask({
                ...taskData.newTask!,
                startAt: today,
              });
              setTimeout(() => submitNewTask(), 0);
            }}
          >
            {taskData.createPending ? "Đang tạo..." : "Tạo"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="shrink-0"
            disabled={taskData.createPending}
            onClick={() => taskData.setNewTask(null)}
          >
            Hủy
          </Button>
        </div>
      </TableCell>
      <TableCell className="bg-muted/40" />
      <TableCell className="bg-muted/40" />
      <TableCell className="bg-muted/40" />
    </TableRow>
  );
  const timelineNewTaskRow = taskData.newTask && (
    <TableRow className="bg-muted/40">
      <TableCell
        className="relative px-0 py-2"
        style={{ width: timelineWidth, ...gridStyle }}
      >
        <div
          className="relative h-8"
          style={{ width: timelineWidth }}
        />
      </TableCell>
    </TableRow>
  );

  if (taskData.isPending || taskData.error) {
    return <QueryMessage error={taskData.error} pending={taskData.isPending} />;
  }

  const segments = monthSegments(timeline.days);
  return (
    <DragDropProvider
      onDragStart={({ operation }) => {
        const sourceId = operation.source?.id;
        if (typeof sourceId !== "string") return;
        setActiveTask(tasks.find((task) => task.id === sourceId) ?? null);
      }}
      onDragEnd={({ operation, canceled }) => {
        setActiveTask(null);
        setDragRevision((revision) => revision + 1);
        const source = operation.source;
        if (
          canceled ||
          !source ||
          typeof source.id !== "string" ||
          !isSortable(source)
        ) {
          return;
        }
        handleTaskDrop(source.id, source.index);
      }}
    >
      <section className="flex min-h-0 min-w-0 max-w-full flex-1 flex-col gap-2 overflow-hidden rounded-lg border bg-background p-2">
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-2">
          <div className="min-w-0" style={{ width: "min(52rem, 58%)" }}>
            <TaskListFilters
              search={search}
              setSearch={setSearch}
              assigneeFilter={assigneeFilter}
              setAssigneeFilter={setAssigneeFilter}
              statusFilter={statusFilter}
              setStatusFilter={setStatusFilter}
              members={taskData.members}
            />
          </div>
          <div className="flex min-w-0 flex-1 flex-wrap items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={scrollToToday}
            >
              <CalendarDays data-icon="inline-start" />
              Hôm nay
            </Button>
            <div
              className="flex items-center rounded-lg border p-0.5"
              role="group"
              aria-label="Độ chia timeline"
            >
              {scaleOptions.map((option) => (
                <Button
                  key={option.value}
                  type="button"
                  size="sm"
                  variant={scale === option.value ? "secondary" : "ghost"}
                  aria-pressed={scale === option.value}
                  onClick={() => setScale(option.value)}
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </div>
        </div>
        {(taskData.updateError ||
          taskData.reorderError ||
          taskData.createError) && (
          <p className="text-sm text-destructive" role="alert">
            {taskData.updateError?.message ??
              taskData.reorderError?.message ??
              taskData.createError?.message}
          </p>
        )}

        <div className="min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden">
          <div className="flex min-w-0">
            <div
              className="shrink-0 flex flex-col"
              style={{ width: "min(52rem, 58%)" }}
            >
              <ProjectTaskTable
                containerClassName="min-h-0 min-w-0 max-w-full flex-1 overflow-x-auto overflow-y-clip"
                className="min-w-[900px]"
                headerRows={headerRows}
                bodyKey={`${tableOrderKey}-${dragRevision}`}
                emptyState={
                  !visibleTasks.length && !taskData.newTask ? (
                    <TableRow>
                      <TableCell
                        colSpan={columns.length}
                        className="h-16 text-center"
                      >
                        Không có công việc phù hợp.
                      </TableCell>
                    </TableRow>
                  ) : null
                }
              >
                {table.getRowModel().rows.map((row) => (
                  <Fragment key={row.id}>
                    {taskData.newTask?.insertBeforeTaskId === row.original.id &&
                      newTaskRow}
                    <SortableTimelineRow
                      task={row.original}
                      index={
                        row.original.parent_task_id
                          ? (taskGroups.children
                              .get(row.original.parent_task_id)
                              ?.findIndex(
                                (task) => task.id === row.original.id,
                              ) ?? -1)
                          : taskGroups.roots.findIndex(
                              (task) => task.id === row.original.id,
                            )
                      }
                      draggedGroup={activeTask?.id === row.original.id}
                      hiddenChild={
                        childrenHidden && row.original.parent_task_id !== null
                      }
                      disabled={
                        !canReorder ||
                        taskData.reorderPending ||
                        taskData.newTask !== null ||
                        taskData.quickCreateOpen
                      }
                    >
                      {(handleRef) =>
                        row.getAllCells().map((cell) => (
                          <TableCell
                            key={cell.id}
                            className={
                              cell.column.id === "select"
                                ? "relative"
                                : undefined
                            }
                          >
                            {cell.column.id === "select" ? (
                              <div className="flex items-center gap-1.5">
                                <button
                                  ref={handleRef}
                                  type="button"
                                  disabled={
                                    !canReorder ||
                                    taskData.reorderPending ||
                                    taskData.newTask !== null ||
                                    taskData.quickCreateOpen
                                  }
                                  aria-label={`Di chuyển ${row.original.title}`}
                                  className="flex size-4 touch-none cursor-grab items-center justify-center rounded text-muted-foreground/30 transition-colors hover:text-foreground group-hover/task-row:text-muted-foreground active:cursor-grabbing disabled:cursor-default"
                                >
                                  <GripVertical className="size-4" />
                                </button>
                                <table.FlexRender cell={cell} />
                                {row.index < visibleTasks.length - 1 && (
                                  <button
                                    type="button"
                                    disabled={
                                      taskData.newTask !== null ||
                                      taskData.quickCreateOpen
                                    }
                                    aria-label={`Thêm công việc sau ${row.original.title}`}
                                    title="Thêm công việc"
                                    onClick={() =>
                                      startTaskBetween(
                                        row.original,
                                        visibleTasks[row.index + 1],
                                      )
                                    }
                                    className="absolute bottom-0 left-1/2 z-10 flex size-5 -translate-x-1/2 translate-y-1/2 items-center justify-center rounded-full border bg-background text-muted-foreground opacity-0 shadow-sm transition hover:bg-accent hover:text-foreground focus-visible:opacity-100 disabled:hidden group-hover/task-row:opacity-100"
                                  >
                                    <Plus className="size-3" />
                                  </button>
                                )}
                              </div>
                            ) : (
                              <table.FlexRender cell={cell} />
                            )}
                          </TableCell>
                        ))
                      }
                    </SortableTimelineRow>
                  </Fragment>
                ))}
                {taskData.newTask &&
                  (!taskData.newTask.insertBeforeTaskId ||
                    !visibleTasks.some(
                      (task) =>
                        task.id === taskData.newTask?.insertBeforeTaskId,
                    )) &&
                  newTaskRow}
              </ProjectTaskTable>
            </div>

            <div ref={scrollRef} className="min-w-0 flex-1 border-l">
              <Table
                containerClassName="overflow-y-clip"
                className="w-max min-w-full table-fixed border-collapse"
              >
                <colgroup>
                  <col style={{ width: timelineWidth }} />
                </colgroup>
                <TableHeader>
                  <TableRow>
                    <TableHead className="h-10 p-0">
                      <div
                        className="relative min-h-10"
                        style={{ width: timelineWidth, ...gridStyle }}
                      >
                        <div
                          className="grid h-5 border-b"
                          style={{
                            gridTemplateColumns: `repeat(${timeline.days.length}, ${dayWidth}px)`,
                          }}
                        >
                          {segments.map((segment) => (
                            <div
                              key={segment.key}
                              className="truncate border-r px-2 text-xs font-medium"
                              style={{ gridColumn: `span ${segment.count}` }}
                            >
                              {segment.label}
                            </div>
                          ))}
                        </div>
                        <div
                          className="grid h-5"
                          style={{
                            gridTemplateColumns: `repeat(${timeline.days.length}, ${dayWidth}px)`,
                          }}
                        >
                          {timeline.days.map((day) => (
                            <div
                              key={day.toISOString()}
                              className="flex flex-col items-center justify-center text-xs"
                              title={dateText(day)}
                            >
                              {dayLabel(day, scale)}
                            </div>
                          ))}
                        </div>
                        {todayOffset >= 0 &&
                          todayOffset < timeline.days.length && (
                            <span
                              aria-hidden="true"
                              className="pointer-events-none absolute inset-y-0 z-10 w-px bg-primary"
                              style={{ left: (todayOffset + 0.5) * dayWidth }}
                            />
                          )}
                      </div>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayedRows.map((task) => {
                    const start = taskDate(task.start_at);
                    const due = taskDate(task.due_at);
                    const hasBar =
                      start !== null && due !== null && due >= start;
                    const clippedStart =
                      start && start < timeline.first ? timeline.first : start;
                    const clippedDue =
                      due && due >= timeline.end
                        ? new Date(timeline.end.getTime() - DAY_MS)
                        : due;
                    const barLeft = clippedStart
                      ? Math.max(
                          0,
                          (clippedStart.getTime() - timeline.first.getTime()) /
                            DAY_MS,
                        ) * dayWidth
                      : 0;
                    const barWidth =
                      clippedStart && clippedDue
                        ? Math.max(
                            dayWidth,
                            ((clippedDue.getTime() - clippedStart.getTime()) /
                              DAY_MS +
                              1) *
                              dayWidth,
                          )
                        : 0;

                    return (
                      <Fragment key={task.id}>
                        {taskData.newTask?.insertBeforeTaskId === task.id &&
                          timelineNewTaskRow}
                        <TableRow>
                          <TableCell
                            className="relative px-0 py-2"
                            style={{ width: timelineWidth, ...gridStyle }}
                          >
                            <div
                              className="relative h-8"
                              style={{ width: timelineWidth }}
                            >
                              {todayOffset >= 0 &&
                                todayOffset < timeline.days.length && (
                                  <span
                                    aria-hidden="true"
                                    className="absolute -inset-y-2 w-px bg-primary"
                                    style={{
                                      left: (todayOffset + 0.5) * dayWidth,
                                    }}
                                  />
                                )}
                              {hasBar &&
                                start &&
                                due &&
                                clippedStart &&
                                clippedDue &&
                                clippedDue >= timeline.first &&
                                clippedStart < timeline.end && (
                                  <span
                                    role="img"
                                    aria-label={`${task.title}: ${dateText(start)} - ${dateText(due)}`}
                                    title={`${dateText(start)} - ${dateText(due)}`}
                                    className={`absolute top-1/2 h-5 -translate-y-1/2 rounded-sm ${barClass(task.status)}`}
                                    style={{ left: barLeft, width: barWidth }}
                                  />
                                )}
                            </div>
                          </TableCell>
                        </TableRow>
                      </Fragment>
                    );
                  })}
                  {taskData.newTask &&
                    (!taskData.newTask.insertBeforeTaskId ||
                      !displayedRows.some(
                        (task) =>
                          task.id === taskData.newTask?.insertBeforeTaskId,
                      )) &&
                    timelineNewTaskRow}
                  {displayedRows.length === 0 && !taskData.newTask && (
                    <TableRow className="h-16">
                      <TableCell className="p-0">
                        <div
                          className="h-16"
                          style={{ width: timelineWidth, ...gridStyle }}
                        />
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>

        <div className="flex min-w-0 flex-wrap items-center justify-between gap-2 border-t pt-3 text-sm">
          <div
            className="min-w-0 shrink-0"
            style={{ width: "min(52rem, 58%)" }}
          >
            {taskData.quickCreateOpen ? (
              <form
                className="flex min-w-0 items-center gap-2"
                onSubmit={submitQuickTask}
              >
                <Input
                  autoFocus
                  value={taskData.quickCreateTitle}
                  onChange={(event) =>
                    taskData.setQuickCreateTitle(event.target.value)
                  }
                  onKeyDown={(event) => {
                    if (event.key === "Escape") {
                      taskData.setQuickCreateOpen(false);
                    }
                  }}
                  placeholder="Nhập tên công việc"
                  aria-label="Tiêu đề công việc mới"
                  maxLength={200}
                  className="min-w-0 flex-1"
                />
                <Button
                  type="submit"
                  size="sm"
                  disabled={
                    !taskData.quickCreateTitle.trim() || taskData.createPending
                  }
                >
                  {taskData.createPending ? "Đang tạo..." : "Tạo"}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={taskData.createPending}
                  onClick={() => taskData.setQuickCreateOpen(false)}
                >
                  Hủy
                </Button>
              </form>
            ) : (
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  taskData.setQuickCreateTitle("");
                  taskData.setQuickCreateOpen(true);
                }}
                disabled={taskData.newTask !== null}
              >
                <Plus data-icon="inline-start" />
                Tạo công việc
              </Button>
            )}
          </div>
          <div className="flex items-center gap-3 text-muted-foreground">
            <span>
              {visibleTasks.length} / {tasks.length} công việc
            </span>
            {Object.keys(rowSelection).length > 0 && (
              <span>{Object.keys(rowSelection).length} đã chọn</span>
            )}
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label="Tải lại công việc"
              onClick={() => void taskData.refetch()}
            >
              <RotateCw />
            </Button>
          </div>
        </div>
      </section>
      <DragOverlay>
        {activeTask && (
          <div
            aria-hidden="true"
            className="w-fit max-w-[calc(100vw-2rem)] overflow-hidden rounded-md border bg-background shadow-lg"
          >
            <div className="truncate px-3 py-2 text-sm">
              {keyPrefix.toUpperCase()}-{activeTask.task_number}{" "}
              {activeTask.title}
            </div>
            {activeTask.parent_task_id === null &&
              !collapsedTasks[activeTask.id] &&
              (taskGroups.children.get(activeTask.id) ?? []).map((child) => (
                <div
                  key={child.id}
                  className="truncate border-t px-3 py-2 pl-8 text-sm text-muted-foreground"
                >
                  {keyPrefix.toUpperCase()}-{child.task_number} {child.title}
                </div>
              ))}
          </div>
        )}
      </DragOverlay>
    </DragDropProvider>
  );
}
