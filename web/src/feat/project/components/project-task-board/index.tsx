import { useDeferredValue, useMemo, useState } from "react";
import { RotateCw } from "lucide-react";
import type { Task, TaskStatus, UUID } from "@/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { statuses } from "../../constants/task";
import { useProjectTasks } from "../project-task-list/hooks";
import { QueryMessage } from "../query-message";

export function ProjectTaskBoard({ projectId }: { projectId: UUID }) {
  const taskData = useProjectTasks(projectId);
  const [search, setSearch] = useState("");
  const [assigneeFilter, setAssigneeFilter] = useState("all");
  const normalizedSearch = useDeferredValue(search).trim().toLocaleLowerCase();
  const { tasks, members, membersById, updateTask } = taskData;

  const visibleTasks = useMemo(
    () =>
      tasks.filter(
        (task) =>
          (!normalizedSearch ||
            task.title.toLocaleLowerCase().includes(normalizedSearch)) &&
          (assigneeFilter === "all" ||
            (assigneeFilter === "unassigned"
              ? task.assignee_id === null
              : task.assignee_id === assigneeFilter)),
      ),
    [tasks, normalizedSearch, assigneeFilter],
  );
  const tasksById = useMemo(
    () =>
      new Map<UUID, Task>(tasks.map((task): [UUID, Task] => [task.id, task])),
    [tasks],
  );

  if (taskData.isPending || taskData.error) {
    return <QueryMessage error={taskData.error} pending={taskData.isPending} />;
  }

  function changeStatus(task: Task, status: TaskStatus) {
    if (task.status !== status) updateTask(task.id, { status });
  }

  return (
    <section className="flex min-h-0 min-w-0 max-w-full flex-1 flex-col gap-2 overflow-hidden rounded-lg border bg-background p-2">
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
      </div>

      {taskData.updateError && (
        <p className="text-sm text-destructive" role="alert">
          {taskData.updateError.message}
        </p>
      )}

      <div className="min-h-0 min-w-0 flex-1 overflow-auto">
        <div className="grid min-w-0 gap-3 lg:grid-cols-3">
          {statuses.map((column) => {
            const columnTasks = visibleTasks.filter(
              (task) => task.status === column.value,
            );
            return (
              <section
                key={column.value}
                aria-label={column.label}
                className="min-h-64 rounded-lg border bg-muted/40 p-3"
                onDragOver={(event) => {
                  event.preventDefault();
                  event.dataTransfer.dropEffect = "move";
                }}
                onDrop={(event) => {
                  event.preventDefault();
                  const task = tasksById.get(
                    event.dataTransfer.getData("text/plain"),
                  );
                  if (task) changeStatus(task, column.value);
                }}
              >
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="font-medium">{column.label}</h2>
                  <span className="text-xs text-muted-foreground">
                    {columnTasks.length}
                  </span>
                </div>
                <div className="flex flex-col gap-2">
                  {columnTasks.map((task) => {
                    const parent = task.parent_task_id
                      ? tasksById.get(task.parent_task_id)
                      : undefined;
                    const assignee = task.assignee_id
                      ? membersById.get(task.assignee_id)
                      : undefined;
                    return (
                      <article
                        key={task.id}
                        draggable
                        onDragStart={(event) => {
                          event.dataTransfer.setData("text/plain", task.id);
                          event.dataTransfer.effectAllowed = "move";
                        }}
                        className="cursor-grab rounded-lg border bg-background p-3 shadow-sm active:cursor-grabbing"
                      >
                        {parent && (
                          <p className="mb-1 truncate text-xs text-muted-foreground">
                            {parent.title}
                          </p>
                        )}
                        <h3 className="text-sm font-medium">{task.title}</h3>
                        <div className="mt-3 flex items-center justify-between gap-2">
                          <span className="truncate text-xs text-muted-foreground">
                            {assignee?.full_name ?? "Chưa giao"}
                          </span>
                          <NativeSelect
                            size="sm"
                            value={task.status}
                            onChange={(event) =>
                              changeStatus(
                                task,
                                event.target.value as TaskStatus,
                              )
                            }
                            aria-label={`Trạng thái: ${task.title}`}
                            className="min-w-28"
                          >
                            {statuses.map((item) => (
                              <NativeSelectOption
                                key={item.value}
                                value={item.value}
                              >
                                {item.label}
                              </NativeSelectOption>
                            ))}
                          </NativeSelect>
                        </div>
                      </article>
                    );
                  })}
                  {columnTasks.length === 0 && (
                    <p className="py-8 text-center text-xs text-muted-foreground">
                      Chưa có công việc
                    </p>
                  )}
                </div>
              </section>
            );
          })}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-3 text-sm text-muted-foreground">
        <span>
          {visibleTasks.length} / {tasks.length} công việc
        </span>
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
    </section>
  );
}
