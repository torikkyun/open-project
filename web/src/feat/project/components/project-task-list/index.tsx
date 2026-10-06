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
import { ChevronRight, GripVertical, Plus, RotateCw } from "lucide-react";
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
import { priorities, statuses } from "./constants";
import { useProjectTasks } from "./hooks";
import { QueryMessage } from "./query-message";
import { TaskListFilters } from "./task-list-filters";
import type { TaskListContext } from "./types";
import { dateInputValue, dateValue, moveTask } from "./utils";

const taskFeatures = tableFeatures({ rowSelectionFeature });
const columnHelper = createColumnHelper<typeof taskFeatures, Task>();

function SortableTaskRow({
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
      className="group/task-row data-[dragging=true]:opacity-40 data-[dragged-group=true]:invisible data-[hidden-child=true]:hidden"
      data-dragging={isDragging}
      data-dragged-group={draggedGroup}
      data-hidden-child={hiddenChild}
    >
      {children(handleRef)}
    </TableRow>
  );
}

export function ProjectTaskList({
  projectId,
  projectKey,
}: {
  projectId: UUID;
  projectKey: string;
}) {
  const [search, setSearch] = useState("");
  const [assigneeFilter, setAssigneeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<"all" | TaskStatus>("all");
  const [rowSelection, setRowSelection] = useState<Record<string, true>>({});
  const [collapsedTasks, setCollapsedTasks] = useState<Record<UUID, true>>({});
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [dragRevision, setDragRevision] = useState(0);

  const tasks = useProjectTasks(projectId);

  const taskGroups = useMemo(() => {
    const roots = tasks.tasks
      .filter((task) => task.parent_task_id === null)
      .sort((left, right) => left.position - right.position);
    const children = new Map<UUID, Task[]>();
    for (const task of tasks.tasks) {
      if (task.parent_task_id) {
        const siblings = children.get(task.parent_task_id) ?? [];
        siblings.push(task);
        children.set(task.parent_task_id, siblings);
      }
    }
    for (const siblings of children.values()) {
      siblings.sort((left, right) => left.position - right.position);
    }
    return { roots, children };
  }, [tasks.tasks]);

  const shortProjectKey =
    projectKey.match(/^[a-z]{1,3}\d*/i)?.[0] ?? projectKey.slice(0, 3);
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
    tasks.setNewTask({
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
    if (!tasks.newTask?.title.trim() || tasks.createPending) return;
    tasks.submitNewTask(tasks.newTask);
  }

  function submitQuickTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    tasks.submitQuickTask(tasks.quickCreateTitle);
  }

  function handleTaskDrop(draggedId: string, targetIndex: number) {
    if (!canReorder) return;
    const draggedTask = tasks.tasks.find((task) => task.id === draggedId);
    if (!draggedTask) return;
    const siblings = draggedTask.parent_task_id
      ? (taskGroups.children.get(draggedTask.parent_task_id) ?? [])
      : taskGroups.roots;
    const from = siblings.findIndex((item) => item.id === draggedId);
    if (
      from < 0 ||
      targetIndex < 0 ||
      targetIndex >= siblings.length ||
      from === targetIndex
    ) {
      return;
    }
    const orderedTasks = moveTask(siblings, from, targetIndex);
    tasks.reorderMutation.mutate({
      parent_task_id: draggedTask.parent_task_id,
      task_ids: orderedTasks.map((item) => item.id),
    });
  }

  const childrenHidden =
    activeTask !== null && activeTask.parent_task_id === null;

  const ctxRef = useRef<TaskListContext>(null!);
  ctxRef.current = {
    canReorder,
    collapsedTasks,
    allTasksCollapsed,
    parentTaskIds,
    members: tasks.members,
    membersById: tasks.membersById,
    rowSelection,
    visibleTasks,
    children: taskGroups.children,
    titleDrafts: tasks.titleDrafts,
    shortProjectKey,
    newTask: tasks.newTask,
    quickCreateOpen: tasks.quickCreateOpen,
    reorderPending: tasks.reorderPending,
    setRowSelection,
    setCollapsedTasks,
    setTitleDrafts: tasks.setTitleDrafts,
    setNewTask: tasks.setNewTask,
    updateTask: tasks.updateTask,
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
            const selectedCount = c.visibleTasks.filter(
              (task) => c.rowSelection[task.id],
            ).length;
            return (
              <div className="flex items-center gap-1.5">
                <span className="size-4" />
                <Checkbox
                  aria-label="Chọn tất cả công việc đang hiển thị"
                  checked={
                    c.visibleTasks.length > 0 &&
                    selectedCount === c.visibleTasks.length
                  }
                  indeterminate={
                    selectedCount > 0 && selectedCount < c.visibleTasks.length
                  }
                  onCheckedChange={(checked) => {
                    c.setRowSelection((selected) => {
                      const next = { ...selected };
                      for (const task of c.visibleTasks) {
                        if (checked) next[task.id] = true;
                        else delete next[task.id];
                      }
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
              <div>
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
              </div>
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
          id: "reporter",
          header: "Người báo cáo",
          cell: ({ row }) => {
            const c = ctxRef.current;
            return (
              <Combobox
                items={c.members.map((member) => member.id)}
                value={row.original.reporter_id}
                itemToStringLabel={(id) =>
                  c.membersById.get(id)?.full_name ?? ""
                }
                autoHighlight
                onValueChange={(reporterId) =>
                  reporterId &&
                  c.updateTask(row.original.id, { reporter_id: reporterId })
                }
              >
                <ComboboxInput
                  aria-label={`Người báo cáo ${row.original.title}`}
                  placeholder="Chọn người báo cáo"
                  className="w-40"
                />
                <ComboboxContent>
                  <ComboboxEmpty>Không tìm thấy người phù hợp.</ComboboxEmpty>
                  <ComboboxList>
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
        columnHelper.display({
          id: "start-date",
          header: "Ngày bắt đầu",
          cell: ({ row }) => (
            <Input
              type="date"
              value={dateInputValue(row.original.start_at)}
              aria-label={`Ngày bắt đầu ${row.original.title}`}
              className="min-w-32"
              onChange={(event) =>
                ctxRef.current.updateTask(row.original.id, {
                  start_at: dateValue(event.target.value),
                })
              }
            />
          ),
        }),
        columnHelper.display({
          id: "due-date",
          header: "Hạn chót",
          cell: ({ row }) => (
            <Input
              type="date"
              value={dateInputValue(row.original.due_at)}
              aria-label={`Ngày kết thúc ${row.original.title}`}
              className="min-w-32"
              onChange={(event) =>
                ctxRef.current.updateTask(row.original.id, {
                  due_at: dateValue(event.target.value),
                })
              }
            />
          ),
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

  const newTaskRow = tasks.newTask && (
    <TableRow className="bg-muted/40">
      <TableCell className="sticky left-0 z-20 bg-muted/40" />

      <TableCell className="sticky left-[3.25rem] z-10 bg-muted/40 min-w-[24rem]">
        <div className="flex items-center gap-2">
          {tasks.newTask.parentTaskId ? (
            <span className="ml-6 size-6 shrink-0" />
          ) : (
            <span className="size-6 shrink-0" />
          )}
          <Input
            autoFocus
            value={tasks.newTask.title}
            onChange={(event) =>
              tasks.setNewTask({
                ...tasks.newTask!,
                title: event.target.value,
              })
            }
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                const today = new Date().toISOString().split("T")[0];
                tasks.setNewTask({
                  ...tasks.newTask!,
                  startAt: today,
                });
                setTimeout(() => submitNewTask(), 0);
              }
              if (event.key === "Escape") tasks.setNewTask(null);
            }}
            placeholder="Nhập tên công việc và nhấn Enter để tạo"
            aria-label="Tiêu đề công việc mới"
            maxLength={200}
            className="min-w-[32rem] flex-1 max-w-[48rem]"
          />
          <Button
            type="button"
            size="sm"
            disabled={!tasks.newTask.title.trim() || tasks.createPending}
            onClick={() => {
              const today = new Date().toISOString().split("T")[0];
              tasks.setNewTask({
                ...tasks.newTask!,
                startAt: today,
              });
              setTimeout(() => submitNewTask(), 0);
            }}
          >
            {tasks.createPending ? "Đang tạo..." : "Tạo"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={tasks.createPending}
            onClick={() => tasks.setNewTask(null)}
          >
            Hủy
          </Button>
        </div>
      </TableCell>

      <TableCell className="bg-muted/40" />
      <TableCell className="bg-muted/40" />
      <TableCell className="bg-muted/40" />
      <TableCell className="bg-muted/40" />
      <TableCell className="bg-muted/40" />
      <TableCell className="bg-muted/40" />
    </TableRow>
  );

  if (tasks.isPending || tasks.error) {
    return <QueryMessage error={tasks.error} pending={tasks.isPending} />;
  }

  return (
    <DragDropProvider
      onDragStart={({ operation }) => {
        const sourceId = operation.source?.id;
        if (typeof sourceId !== "string") return;
        setActiveTask(tasks.tasks.find((task) => task.id === sourceId) ?? null);
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
      <section className="min-w-0 max-w-full space-y-3 overflow-hidden rounded-lg border bg-background p-3">
        <TaskListFilters
          search={search}
          setSearch={setSearch}
          assigneeFilter={assigneeFilter}
          setAssigneeFilter={setAssigneeFilter}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          members={tasks.members}
        />

        {(tasks.updateError || tasks.reorderError || tasks.createError) && (
          <p className="text-sm text-destructive" role="alert">
            {tasks.updateError?.message ??
              tasks.reorderError?.message ??
              tasks.createError?.message}
          </p>
        )}
        <Table
          containerClassName="h-[calc(100svh-20.25rem)] min-w-0 max-w-full overflow-auto"
          className="min-w-[900px]"
        >
          <TableHeader>
            {table.getHeaderGroups().map((group) => (
              <TableRow key={group.id}>
                {group.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className="sticky top-0 z-10 bg-background"
                  >
                    {header.isPlaceholder ? null : (
                      <table.FlexRender header={header} />
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody key={`${tableOrderKey}-${dragRevision}`}>
            {table.getRowModel().rows.map((row) => (
              <Fragment key={row.id}>
                {tasks.newTask?.insertBeforeTaskId === row.original.id &&
                  newTaskRow}
                <SortableTaskRow
                  task={row.original}
                  index={
                    row.original.parent_task_id
                      ? (taskGroups.children
                          .get(row.original.parent_task_id)
                          ?.findIndex((task) => task.id === row.original.id) ??
                        -1)
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
                    tasks.reorderPending ||
                    tasks.newTask !== null ||
                    tasks.quickCreateOpen
                  }
                >
                  {(handleRef) =>
                    row.getAllCells().map((cell) => (
                      <TableCell
                        key={cell.id}
                        className={
                          cell.column.id === "select" ? "relative" : undefined
                        }
                      >
                        {cell.column.id === "select" ? (
                          <div className="flex items-center gap-1.5">
                            <button
                              ref={handleRef}
                              type="button"
                              disabled={
                                !canReorder ||
                                tasks.reorderPending ||
                                tasks.newTask !== null ||
                                tasks.quickCreateOpen
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
                                  tasks.newTask !== null ||
                                  tasks.quickCreateOpen
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
                </SortableTaskRow>
              </Fragment>
            ))}
            {tasks.newTask &&
              (!tasks.newTask.insertBeforeTaskId ||
                !visibleTasks.some(
                  (task) => task.id === tasks.newTask?.insertBeforeTaskId,
                )) &&
              newTaskRow}
            {!visibleTasks.length && !tasks.newTask && (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-16 text-center"
                >
                  Không có công việc phù hợp.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-3 text-sm">
          {tasks.quickCreateOpen ? (
            <form
              className="flex min-w-0 flex-1 items-center gap-2"
              onSubmit={submitQuickTask}
            >
              <Input
                autoFocus
                value={tasks.quickCreateTitle}
                onChange={(event) =>
                  tasks.setQuickCreateTitle(event.target.value)
                }
                onKeyDown={(event) => {
                  if (event.key === "Escape") tasks.setQuickCreateOpen(false);
                }}
                placeholder="Nhập tên công việc"
                aria-label="Tiêu đề công việc mới"
                maxLength={200}
                className="min-w-0 flex-1"
              />
              <Button
                type="submit"
                size="sm"
                disabled={!tasks.quickCreateTitle.trim() || tasks.createPending}
              >
                {tasks.createPending ? "Đang tạo..." : "Tạo"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={tasks.createPending}
                onClick={() => tasks.setQuickCreateOpen(false)}
              >
                Hủy
              </Button>
            </form>
          ) : (
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                tasks.setQuickCreateTitle("");
                tasks.setQuickCreateOpen(true);
              }}
              disabled={tasks.newTask !== null}
            >
              <Plus data-icon="inline-start" />
              Tạo công việc
            </Button>
          )}
          <div className="flex items-center gap-3 text-muted-foreground">
            <span>
              {visibleTasks.length} / {tasks.tasks.length} công việc
            </span>
            {Object.keys(rowSelection).length > 0 && (
              <span>{Object.keys(rowSelection).length} đã chọn</span>
            )}
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label="Tải lại công việc"
              onClick={() => void tasks.refetch()}
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
              {shortProjectKey.toUpperCase()}-{activeTask.task_number}{" "}
              {activeTask.title}
            </div>
            {activeTask.parent_task_id === null &&
              !collapsedTasks[activeTask.id] &&
              (taskGroups.children.get(activeTask.id) ?? []).map((child) => (
                <div
                  key={child.id}
                  className="truncate border-t px-3 py-2 pl-8 text-sm text-muted-foreground"
                >
                  {shortProjectKey.toUpperCase()}-{child.task_number}{" "}
                  {child.title}
                </div>
              ))}
          </div>
        )}
      </DragOverlay>
    </DragDropProvider>
  );
}
