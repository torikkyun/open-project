import { useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { api, type Task, type TaskStatus, type UUID } from "@/api";
import { statuses, taskQueryKey } from "@/feat/project/constants/task";
import { QueryMessage } from "@/feat/project/components/query-message";
import { useProjectTaskData } from "@/feat/project/hooks/use-project-task-data";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";

export function ProjectTaskBoard({ projectId }: { projectId: UUID }) {
  const queryClient = useQueryClient();
  const taskData = useProjectTaskData(projectId);
  const updateMutation = useMutation({
    mutationFn: ({ taskId, status }: { taskId: UUID; status: TaskStatus }) =>
      api.updateTask(projectId, taskId, { status }),
    onMutate: async ({ taskId, status }) => {
      const queryKey = taskQueryKey(projectId);
      await queryClient.cancelQueries({ queryKey });
      const previousTasks = queryClient.getQueryData<Task[]>(queryKey);
      queryClient.setQueryData<Task[]>(queryKey, (tasks) =>
        tasks?.map((task) => (task.id === taskId ? { ...task, status } : task)),
      );
      return { previousTasks };
    },
    onSuccess: (updatedTask) => {
      queryClient.setQueryData<Task[]>(taskQueryKey(projectId), (tasks) =>
        tasks?.map((task) => (task.id === updatedTask.id ? updatedTask : task)),
      );
    },
    onError: (_error, _variables, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(
          taskQueryKey(projectId),
          context.previousTasks,
        );
      }
    },
  });

  const { tasks, membersById } = taskData;
  const tasksById = useMemo(
    () =>
      new Map<UUID, Task>(tasks.map((task): [UUID, Task] => [task.id, task])),
    [tasks],
  );
  if (taskData.isPending || taskData.error) {
    return (
      <QueryMessage
        error={taskData.error}
        pending={taskData.isPending}
      />
    );
  }

  function changeStatus(task: Task, status: TaskStatus) {
    if (task.status !== status && !updateMutation.isPending) {
      updateMutation.mutate({ taskId: task.id, status });
    }
  }

  return (
    <section className="space-y-4">
      {updateMutation.error && (
        <p className="text-sm text-destructive" role="alert">
          {updateMutation.error.message}
        </p>
      )}
      <div className="grid min-w-0 gap-4 lg:grid-cols-3">
        {statuses.map((column) => {
          const columnTasks = tasks.filter(
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
                      draggable={!updateMutation.isPending}
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
                            changeStatus(task, event.target.value as TaskStatus)
                          }
                          aria-label={`Trạng thái: ${task.title}`}
                          className="min-w-28"
                          disabled={updateMutation.isPending}
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
    </section>
  );
}
