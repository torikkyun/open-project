import { useMemo, useState, type DragEvent, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createColumnHelper,
  rowSelectionFeature,
  tableFeatures,
  useTable,
} from "@tanstack/react-table";
import { ChevronRight, GripVertical, Plus, RotateCw } from "lucide-react";

import {
  api,
  type Task,
  type TaskCreate,
  type TaskPriority,
  type TaskReorder,
  type TaskStatus,
  type TaskUpdate,
  type UUID,
  type User,
} from "@/api";
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
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const statuses: { value: TaskStatus; label: string }[] = [
  { value: "todo", label: "Cần làm" },
  { value: "in_progress", label: "Đang thực hiện" },
  { value: "done", label: "Hoàn thành" },
];

const priorities: { value: TaskPriority; label: string }[] = [
  { value: "none", label: "Không" },
  { value: "low", label: "Thấp" },
  { value: "medium", label: "Trung bình" },
  { value: "high", label: "Cao" },
  { value: "highest", label: "Khẩn cấp" },
];

const taskFeatures = tableFeatures({ rowSelectionFeature });
const columnHelper = createColumnHelper<typeof taskFeatures, Task>();
const taskQueryKey = (projectId: UUID) => ["project-tasks", projectId];
const memberQueryKey = (projectId: UUID) => ["project-members", projectId];

type TaskDraft = {
  parentTaskId: UUID | null;
  title: string;
  assigneeId: string;
  reporterId: string;
  priority: TaskPriority;
  status: TaskStatus;
  startAt: string;
  dueAt: string;
};

function dateInputValue(value: string | null) {
  return value ? value.slice(0, 10) : "";
}

function dateValue(value: string) {
  return value ? new Date(`${value}T12:00:00.000Z`).toISOString() : null;
}

function moveTask<T>(items: T[], sourceIndex: number, targetIndex: number) {
  const next = [...items];
  const [moved] = next.splice(sourceIndex, 1);
  if (moved !== undefined) next.splice(targetIndex, 0, moved);
  return next;
}

function QueryMessage({
  error,
  pending,
}: {
  error: Error | null;
  pending: boolean;
}) {
  if (error) {
    return (
      <p className="py-8 text-center text-sm text-destructive" role="alert">
        {error.message}
      </p>
    );
  }
  if (pending) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        Đang tải công việc...
      </p>
    );
  }
  return null;
}

export function ProjectTaskList({
  projectId,
  projectKey,
}: {
  projectId: UUID;
  projectKey: string;
}) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [assigneeFilter, setAssigneeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<"all" | TaskStatus>("all");
  const [rowSelection, setRowSelection] = useState<Record<string, true>>({});
  const [collapsedTasks, setCollapsedTasks] = useState<Record<UUID, true>>({});
  const [newTask, setNewTask] = useState<TaskDraft | null>(null);
  const [quickCreateOpen, setQuickCreateOpen] = useState(false);
  const [quickCreateTitle, setQuickCreateTitle] = useState("");
  const [titleDrafts, setTitleDrafts] = useState<Record<UUID, string>>({});
  const tasksQuery = useQuery({
    queryKey: taskQueryKey(projectId),
    queryFn: () => api.listAllTasks(projectId),
  });
  const membersQuery = useQuery({
    queryKey: memberQueryKey(projectId),
    queryFn: () => api.listMembers(projectId),
  });
  const updateMutation = useMutation({
    mutationFn: ({ taskId, changes }: { taskId: UUID; changes: TaskUpdate }) =>
      api.updateTask(projectId, taskId, changes),
    onSuccess: (updatedTask) => {
      queryClient.setQueryData<Task[]>(taskQueryKey(projectId), (tasks) =>
        tasks?.map((task) => (task.id === updatedTask.id ? updatedTask : task)),
      );
    },
  });
  const reorderMutation = useMutation({
    mutationFn: (body: TaskReorder) => api.reorderTasks(projectId, body),
    onMutate: async ({ parent_task_id, task_ids }) => {
      const queryKey = taskQueryKey(projectId);
      await queryClient.cancelQueries({ queryKey });
      const previousTasks = queryClient.getQueryData<Task[]>(queryKey);
      const positions = new Map<UUID, number>(
        task_ids.map((id, index): [UUID, number] => [id, index]),
      );
      queryClient.setQueryData<Task[]>(queryKey, (tasks) =>
        tasks?.map((task) =>
          task.parent_task_id === parent_task_id && positions.has(task.id)
            ? { ...task, position: positions.get(task.id) ?? task.position }
            : task,
        ),
      );
      return { previousTasks };
    },
    onError: (_error, _variables, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(
          taskQueryKey(projectId),
          context.previousTasks,
        );
      }
    },
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: taskQueryKey(projectId) }),
  });
  const createMutation = useMutation({
    mutationFn: (body: TaskCreate) => api.createTask(projectId, body),
    onSuccess: (createdTask) => {
      queryClient.setQueryData<Task[]>(taskQueryKey(projectId), (tasks) =>
        tasks ? [...tasks, createdTask] : [createdTask],
      );
      setNewTask(null);
      setQuickCreateOpen(false);
      setQuickCreateTitle("");
    },
  });

  const tasks = tasksQuery.data ?? [];
  const members = membersQuery.data ?? [];
  const membersById = useMemo(
    () =>
      new Map<UUID, User>(
        members.map((member): [UUID, User] => [member.id, member]),
      ),
    [members],
  );
  const taskGroups = useMemo(() => {
    const roots = tasks
      .filter((task) => task.parent_task_id === null)
      .sort((left, right) => left.position - right.position);
    const children = new Map<UUID, Task[]>();
    for (const task of tasks) {
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
  }, [tasks]);
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

  function updateTask(taskId: UUID, changes: TaskUpdate) {
    if (!updateMutation.isPending) updateMutation.mutate({ taskId, changes });
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

  function openQuickCreate() {
    createMutation.reset();
    setQuickCreateTitle("");
    setQuickCreateOpen(true);
  }

  function startTask() {
    createMutation.reset();
    setNewTask({
      parentTaskId: null,
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
    if (!newTask?.title.trim() || createMutation.isPending) return;
    createMutation.mutate({
      title: newTask.title.trim(),
      description: null,
      status: newTask.status,
      priority: newTask.priority,
      start_at: dateValue(newTask.startAt),
      due_at: dateValue(newTask.dueAt),
      assignee_id: newTask.assigneeId || null,
      reporter_id: newTask.reporterId || null,
      parent_task_id: newTask.parentTaskId,
    });
  }

  function submitQuickTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const title = quickCreateTitle.trim();
    if (!title || createMutation.isPending) return;
    createMutation.mutate({
      title,
      description: null,
      status: "todo",
      priority: "none",
      start_at: null,
      due_at: null,
      assignee_id: null,
      parent_task_id: null,
    });
  }

  function handleTaskDrop(event: DragEvent<HTMLTableRowElement>, task: Task) {
    event.preventDefault();
    const draggedId = event.dataTransfer.getData("text/plain");
    if (!canReorder || !draggedId || draggedId === task.id) return;
    const siblings = task.parent_task_id
      ? (taskGroups.children.get(task.parent_task_id) ?? [])
      : taskGroups.roots;
    const draggedTask = tasks.find((item) => item.id === draggedId);
    if (!draggedTask || draggedTask.parent_task_id !== task.parent_task_id)
      return;
    const from = siblings.findIndex((item) => item.id === draggedId);
    const to = siblings.findIndex((item) => item.id === task.id);
    if (from < 0 || to < 0) return;
    const orderedTasks = moveTask(siblings, from, to);
    reorderMutation.mutate({
      parent_task_id: task.parent_task_id,
      task_ids: orderedTasks.map((item) => item.id),
    });
  }

  const columns = useMemo(
    () =>
      columnHelper.columns([
        columnHelper.display({
          id: "select",
          header: () => {
            const selectedCount = visibleTasks.filter(
              (task) => rowSelection[task.id],
            ).length;
            return (
              <div className="flex items-center gap-1.5">
                <span className="size-4" />
                <Checkbox
                  aria-label="Chọn tất cả công việc đang hiển thị"
                  checked={
                    visibleTasks.length > 0 &&
                    selectedCount === visibleTasks.length
                  }
                  indeterminate={
                    selectedCount > 0 && selectedCount < visibleTasks.length
                  }
                  onCheckedChange={(checked) => {
                    setRowSelection((selected) => {
                      const next = { ...selected };
                      for (const task of visibleTasks) {
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
            const task = row.original;
            return (
              <div className="flex items-center gap-1.5">
                {canReorder ? (
                  <button
                    type="button"
                    draggable={!reorderMutation.isPending}
                    aria-label={`Di chuyển ${task.title}`}
                    className="flex size-4 cursor-grab items-center justify-center rounded text-muted-foreground/30 transition-colors hover:text-foreground group-hover/task-row:text-muted-foreground active:cursor-grabbing"
                    onDragStart={(event) => {
                      event.dataTransfer.setData("text/plain", task.id);
                      event.dataTransfer.effectAllowed = "move";
                      const tr = event.currentTarget.closest("tr");
                      if (tr) event.dataTransfer.setDragImage(tr, 0, 0);
                    }}
                  >
                    <GripVertical className="size-4" />
                  </button>
                ) : (
                  <span className="size-4" />
                )}
                <Checkbox
                  aria-label={`Chọn ${task.title}`}
                  checked={Boolean(rowSelection[task.id])}
                  onCheckedChange={(checked) =>
                    setRowSelection((selected) => {
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
          header: () => (
            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                aria-label={
                  allTasksCollapsed
                    ? "Mở rộng tất cả công việc"
                    : "Thu gọn tất cả công việc"
                }
                title={allTasksCollapsed ? "Mở rộng tất cả" : "Thu gọn tất cả"}
                disabled={!parentTaskIds.length}
                onClick={toggleAllTasks}
              >
                <ChevronRight
                  className={allTasksCollapsed ? "" : "rotate-90"}
                />
              </Button>
              Công việc
            </div>
          ),
          cell: ({ row }) => {
            const task = row.original;
            const depth = task.parent_task_id ? 1 : 0;
            const hasChildren =
              (taskGroups.children.get(task.id)?.length ?? 0) > 0;
            return (
              <div className="flex min-w-[24rem] max-w-[40rem] items-center gap-2">
                {depth ? (
                  <span className="ml-6 size-6 shrink-0" />
                ) : hasChildren ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    aria-label={`${collapsedTasks[task.id] ? "Mở rộng" : "Thu gọn"} công việc con của ${task.title}`}
                    title={collapsedTasks[task.id] ? "Mở rộng" : "Thu gọn"}
                    onClick={() =>
                      setCollapsedTasks((collapsed) => {
                        const next = { ...collapsed };
                        if (next[task.id]) delete next[task.id];
                        else next[task.id] = true;
                        return next;
                      })
                    }
                  >
                    <ChevronRight
                      className={collapsedTasks[task.id] ? "" : "rotate-90"}
                    />
                  </Button>
                ) : (
                  <span className="size-6 shrink-0" />
                )}
                <span className="shrink-0 whitespace-nowrap text-primary">
                  {shortProjectKey.toUpperCase()}-{task.task_number}
                </span>
                <Input
                  value={titleDrafts[task.id] ?? task.title}
                  aria-label={`Tiêu đề ${task.title}`}
                  className="min-w-0 flex-1 truncate border-transparent bg-transparent shadow-none hover:border-input focus-visible:border-ring"
                  onChange={(event) =>
                    setTitleDrafts((drafts) => ({
                      ...drafts,
                      [task.id]: event.target.value,
                    }))
                  }
                  onKeyDown={(event) => {
                    if (event.key === "Enter") event.currentTarget.blur();
                  }}
                  onBlur={(event) => {
                    const title = event.currentTarget.value.trim();
                    if (title && title !== task.title) {
                      updateTask(task.id, { title });
                    }
                    setTitleDrafts((drafts) => {
                      const next = { ...drafts };
                      delete next[task.id];
                      return next;
                    });
                  }}
                />
                {depth === 0 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    disabled={newTask !== null || quickCreateOpen}
                    aria-label={`Tạo công việc con cho ${task.title}`}
                    title="Tạo công việc con"
                    className="opacity-0 transition-opacity group-hover/task-row:opacity-100 focus-visible:opacity-100"
                    onClick={() =>
                      setNewTask({
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
            const task = row.original;
            return (
              <Combobox
                items={members.map((member) => member.id)}
                value={task.assignee_id ?? ""}
                itemToStringLabel={(id) =>
                  membersById.get(id)?.full_name ?? "Chưa phân công"
                }
                autoHighlight
                onValueChange={(assigneeId) =>
                  updateTask(task.id, {
                    assignee_id: assigneeId || null,
                  })
                }
              >
                <ComboboxInput
                  aria-label={`Người thực hiện ${task.title}`}
                  placeholder="Chưa phân công"
                  className="w-40"
                  disabled={updateMutation.isPending}
                  showClear
                />
                <ComboboxContent>
                  <ComboboxEmpty>Không tìm thấy người phù hợp.</ComboboxEmpty>
                  <ComboboxList>
                    <ComboboxItem value="">Chưa phân công</ComboboxItem>
                    {members.map((member) => (
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
          cell: ({ row }) => (
            <Combobox
              items={members.map((member) => member.id)}
              value={row.original.reporter_id}
              itemToStringLabel={(id) => membersById.get(id)?.full_name ?? ""}
              autoHighlight
              onValueChange={(reporterId) =>
                reporterId &&
                updateTask(row.original.id, { reporter_id: reporterId })
              }
            >
              <ComboboxInput
                aria-label={`Người báo cáo ${row.original.title}`}
                placeholder="Chọn người báo cáo"
                className="w-40"
                disabled={updateMutation.isPending}
              />
              <ComboboxContent>
                <ComboboxEmpty>Không tìm thấy người phù hợp.</ComboboxEmpty>
                <ComboboxList>
                  {members.map((member) => (
                    <ComboboxItem key={member.id} value={member.id}>
                      {member.full_name}
                    </ComboboxItem>
                  ))}
                </ComboboxList>
              </ComboboxContent>
            </Combobox>
          ),
        }),
        columnHelper.display({
          id: "priority",
          header: "Độ ưu tiên",
          cell: ({ row }) => (
            <Combobox
              items={priorities.map((item) => item.value)}
              value={row.original.priority}
              itemToStringLabel={(value) =>
                priorities.find((item) => item.value === value)?.label ?? ""
              }
              autoHighlight
              onValueChange={(priority) =>
                priority && updateTask(row.original.id, { priority })
              }
            >
              <ComboboxInput
                aria-label={`Độ ưu tiên ${row.original.title}`}
                className="w-36"
                disabled={updateMutation.isPending}
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
          ),
        }),
        columnHelper.display({
          id: "status",
          header: "Trạng thái",
          cell: ({ row }) => (
            <Combobox
              items={statuses.map((item) => item.value)}
              value={row.original.status}
              itemToStringLabel={(value) =>
                statuses.find((item) => item.value === value)?.label ?? ""
              }
              autoHighlight
              onValueChange={(status) =>
                status && updateTask(row.original.id, { status })
              }
            >
              <ComboboxInput
                aria-label={`Trạng thái ${row.original.title}`}
                className="w-40"
                disabled={updateMutation.isPending}
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
          ),
        }),
        columnHelper.display({
          id: "start-date",
          header: "Ngày bắt đầu",
          cell: ({ row }) => (
            <Input
              type="date"
              value={dateInputValue(row.original.start_at)}
              aria-label={`Ngày bắt đầu ${row.original.title}`}
              disabled={updateMutation.isPending}
              className="min-w-32"
              onChange={(event) =>
                updateTask(row.original.id, {
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
              disabled={updateMutation.isPending}
              className="min-w-32"
              onChange={(event) =>
                updateTask(row.original.id, {
                  due_at: dateValue(event.target.value),
                })
              }
            />
          ),
        }),
      ]),
    [
      canReorder,
      collapsedTasks,
      allTasksCollapsed,
      parentTaskIds,
      members,
      membersById,
      projectKey,
      projectId,
      rowSelection,
      updateMutation.isPending,
      visibleTasks,
      taskGroups.children,
      toggleAllTasks,
    ],
  );
  const table = useTable({
    features: taskFeatures,
    data: visibleTasks,
    columns,
    getRowId: (task) => task.id,
    state: { rowSelection },
    onRowSelectionChange: setRowSelection,
  });

  const queryError = tasksQuery.error ?? membersQuery.error;
  if (tasksQuery.isPending || membersQuery.isPending || queryError) {
    return (
      <QueryMessage
        error={queryError}
        pending={tasksQuery.isPending || membersQuery.isPending}
      />
    );
  }

  return (
    <section className="min-w-0 max-w-full space-y-3 overflow-hidden rounded-lg border bg-background p-3">
      <div className="flex flex-wrap items-center gap-2">
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Tìm công việc"
          aria-label="Tìm công việc"
          className="min-w-52 flex-1 sm:max-w-xs"
        />
        <NativeSelect
          value={assigneeFilter}
          onChange={(event) => setAssigneeFilter(event.target.value)}
          aria-label="Lọc theo người thực hiện"
          className="min-w-36"
        >
          <NativeSelectOption value="all">
            Tất cả người thực hiện
          </NativeSelectOption>
          <NativeSelectOption value="unassigned">
            Chưa phân công
          </NativeSelectOption>
          {members.map((member) => (
            <NativeSelectOption key={member.id} value={member.id}>
              {member.full_name}
            </NativeSelectOption>
          ))}
        </NativeSelect>
        <NativeSelect
          value={statusFilter}
          onChange={(event) =>
            setStatusFilter(event.target.value as "all" | TaskStatus)
          }
          aria-label="Lọc theo trạng thái"
          className="min-w-36"
        >
          <NativeSelectOption value="all">Tất cả trạng thái</NativeSelectOption>
          {statuses.map((item) => (
            <NativeSelectOption key={item.value} value={item.value}>
              {item.label}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </div>

      {(updateMutation.error ||
        reorderMutation.error ||
        createMutation.error) && (
        <p className="text-sm text-destructive" role="alert">
          {updateMutation.error?.message ??
            reorderMutation.error?.message ??
            createMutation.error?.message}
        </p>
      )}
      <div className="h-[calc(100svh-20.25rem)] min-w-0 max-w-full overflow-auto">
        <Table className="min-w-[900px]">
          <TableHeader>
            {table.getHeaderGroups().map((group) => (
              <TableRow key={group.id}>
                {group.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder ? null : (
                      <table.FlexRender header={header} />
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                className="group/task-row"
                onDragOver={
                  canReorder ? (event) => event.preventDefault() : undefined
                }
                onDrop={
                  canReorder
                    ? (event) => handleTaskDrop(event, row.original)
                    : undefined
                }
              >
                {row.getAllCells().map((cell) => (
                  <TableCell
                    key={cell.id}
                    className={
                      cell.column.id === "select" ? "relative" : undefined
                    }
                  >
                    <table.FlexRender cell={cell} />
                    {cell.column.id === "select" &&
                      row.index < visibleTasks.length - 1 && (
                        <button
                          type="button"
                          disabled={newTask !== null || quickCreateOpen}
                          aria-label={`Thêm công việc sau ${row.original.title}`}
                          title="Thêm công việc"
                          onClick={startTask}
                          className="absolute bottom-0 left-1/2 z-10 flex size-5 -translate-x-1/2 translate-y-1/2 items-center justify-center rounded-full border bg-background text-muted-foreground opacity-0 shadow-sm transition hover:bg-accent hover:text-foreground focus-visible:opacity-100 disabled:hidden group-hover/task-row:opacity-100"
                        >
                          <Plus className="size-3" />
                        </button>
                      )}
                  </TableCell>
                ))}
              </TableRow>
            ))}
            {newTask && (
              <TableRow>
                <TableCell />
                <TableCell>
                  <div className="flex min-w-[24rem] items-center gap-2">
                    <span className="whitespace-nowrap text-primary">
                      {newTask.parentTaskId
                        ? `Công việc con của ${tasks.find((task) => task.id === newTask.parentTaskId)?.title ?? "công việc"}`
                        : "Công việc mới"}
                    </span>
                    <Input
                      autoFocus
                      value={newTask.title}
                      onChange={(event) =>
                        setNewTask({ ...newTask, title: event.target.value })
                      }
                      onKeyDown={(event) => {
                        if (event.key === "Enter") submitNewTask();
                        if (event.key === "Escape") setNewTask(null);
                      }}
                      placeholder="Nhập tên công việc"
                      aria-label="Tiêu đề công việc mới"
                      maxLength={200}
                    />
                  </div>
                </TableCell>
                <TableCell>
                  <NativeSelect
                    size="sm"
                    value={newTask.assigneeId}
                    onChange={(event) =>
                      setNewTask({ ...newTask, assigneeId: event.target.value })
                    }
                    aria-label="Người thực hiện công việc mới"
                    className="min-w-32"
                  >
                    <NativeSelectOption value="">
                      Chưa phân công
                    </NativeSelectOption>
                    {members.map((member) => (
                      <NativeSelectOption key={member.id} value={member.id}>
                        {member.full_name}
                      </NativeSelectOption>
                    ))}
                  </NativeSelect>
                </TableCell>
                <TableCell>
                  <NativeSelect
                    size="sm"
                    value={newTask.reporterId}
                    onChange={(event) =>
                      setNewTask({ ...newTask, reporterId: event.target.value })
                    }
                    aria-label="Người báo cáo công việc mới"
                    className="min-w-32"
                  >
                    <NativeSelectOption value="">Tôi</NativeSelectOption>
                    {members.map((member) => (
                      <NativeSelectOption key={member.id} value={member.id}>
                        {member.full_name}
                      </NativeSelectOption>
                    ))}
                  </NativeSelect>
                </TableCell>
                <TableCell>
                  <NativeSelect
                    size="sm"
                    value={newTask.priority}
                    onChange={(event) =>
                      setNewTask({
                        ...newTask,
                        priority: event.target.value as TaskPriority,
                      })
                    }
                    aria-label="Mức ưu tiên công việc mới"
                    className="min-w-28"
                  >
                    {priorities.map((item) => (
                      <NativeSelectOption key={item.value} value={item.value}>
                        {item.label}
                      </NativeSelectOption>
                    ))}
                  </NativeSelect>
                </TableCell>
                <TableCell>
                  <NativeSelect
                    size="sm"
                    value={newTask.status}
                    onChange={(event) =>
                      setNewTask({
                        ...newTask,
                        status: event.target.value as TaskStatus,
                      })
                    }
                    aria-label="Trạng thái công việc mới"
                    className="min-w-32"
                  >
                    {statuses.map((item) => (
                      <NativeSelectOption key={item.value} value={item.value}>
                        {item.label}
                      </NativeSelectOption>
                    ))}
                  </NativeSelect>
                </TableCell>
                <TableCell>Chưa giải quyết</TableCell>
                <TableCell>
                  <Input
                    type="date"
                    value={newTask.startAt}
                    onChange={(event) =>
                      setNewTask({ ...newTask, startAt: event.target.value })
                    }
                    aria-label="Ngày bắt đầu công việc mới"
                    className="min-w-36"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="date"
                    value={newTask.dueAt}
                    onChange={(event) =>
                      setNewTask({ ...newTask, dueAt: event.target.value })
                    }
                    aria-label="Ngày kết thúc công việc mới"
                    className="min-w-36"
                  />
                  <Button
                    type="button"
                    size="sm"
                    className="mt-1"
                    disabled={!newTask.title.trim() || createMutation.isPending}
                    onClick={() => submitNewTask()}
                  >
                    {createMutation.isPending ? "Đang tạo..." : "Tạo"}
                  </Button>
                </TableCell>
              </TableRow>
            )}
            {!visibleTasks.length && !newTask && (
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
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-3 text-sm">
        {quickCreateOpen ? (
          <form
            className="flex min-w-0 flex-1 items-center gap-2"
            onSubmit={submitQuickTask}
          >
            <Input
              autoFocus
              value={quickCreateTitle}
              onChange={(event) => setQuickCreateTitle(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Escape") setQuickCreateOpen(false);
              }}
              placeholder="Nhập tên công việc"
              aria-label="Tiêu đề công việc mới"
              maxLength={200}
              className="min-w-0 flex-1"
            />
            <Button
              type="submit"
              size="sm"
              disabled={!quickCreateTitle.trim() || createMutation.isPending}
            >
              {createMutation.isPending ? "Đang tạo..." : "Tạo"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={createMutation.isPending}
              onClick={() => setQuickCreateOpen(false)}
            >
              Hủy
            </Button>
          </form>
        ) : (
          <Button
            type="button"
            variant="ghost"
            onClick={openQuickCreate}
            disabled={newTask !== null}
          >
            <Plus data-icon="inline-start" />
            Tạo công việc
          </Button>
        )}
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
            onClick={() => void tasksQuery.refetch()}
          >
            <RotateCw />
          </Button>
        </div>
      </div>
    </section>
  );
}
