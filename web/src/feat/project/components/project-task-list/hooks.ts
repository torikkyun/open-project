import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { api, type Task, type TaskCreate, type TaskUpdate, type UUID } from "@/api";
import { taskQueryKey } from "../../constants/task";
import { useProjectTaskData } from "../../hooks/use-project-task-data";
import type { TaskDraft } from "./types";
import { dateValue } from "./utils";

export function useProjectTasks(projectId: UUID) {
  const queryClient = useQueryClient();
  const taskData = useProjectTaskData(projectId);

  const [newTask, setNewTask] = useState<TaskDraft | null>(null);
  const [quickCreateOpen, setQuickCreateOpen] = useState(false);
  const [quickCreateTitle, setQuickCreateTitle] = useState("");
  const memberItems = useMemo(
    () => ["", ...taskData.members.map((member) => member.id)],
    [taskData.members],
  );

  const updateMutation = useMutation({
    mutationFn: ({ taskId, changes }: { taskId: UUID; changes: TaskUpdate }) =>
      api.updateTask(projectId, taskId, changes),
    onMutate: async ({ taskId, changes }) => {
      const queryKey = taskQueryKey(projectId);
      await queryClient.cancelQueries({ queryKey });
      const previousTasks = queryClient.getQueryData<Task[]>(queryKey);
      const previousTask = previousTasks?.find((task) => task.id === taskId);
      const optimisticTask = previousTask
        ? {
            ...previousTask,
            ...changes,
            reporter_id: changes.reporter_id ?? previousTask.reporter_id,
          }
        : undefined;
      queryClient.setQueryData<Task[]>(queryKey, (tasks) =>
        tasks?.map((task) =>
          task.id === taskId && optimisticTask ? optimisticTask : task,
        ),
      );
      return { previousTask, optimisticTask };
    },
    onError: (_error, { taskId, changes }, context) => {
      const previousTask = context?.previousTask;
      const optimisticTask = context?.optimisticTask;
      if (!previousTask || !optimisticTask) return;
      queryClient.setQueryData<Task[]>(taskQueryKey(projectId), (tasks) =>
        tasks?.map((task) => {
          if (task.id !== taskId) return task;
          const restored = { ...task };
          for (const key of Object.keys(changes) as (keyof TaskUpdate)[]) {
            if (task[key] === optimisticTask[key]) {
              Object.assign(restored, { [key]: previousTask[key] });
            }
          }
          return restored;
        }),
      );
    },
    onSuccess: (updatedTask) => {
      queryClient.setQueryData<Task[]>(taskQueryKey(projectId), (tasks) =>
        tasks?.map((task) => (task.id === updatedTask.id ? updatedTask : task)),
      );
    },
  });

  const reorderMutation = useMutation({
    mutationFn: (body: Parameters<typeof api.reorderTasks>[1]) =>
      api.reorderTasks(projectId, body),
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
    mutationFn: ({
      body,
    }: {
      body: TaskCreate;
      insertBeforeTaskId?: UUID;
    }) => api.createTask(projectId, body),
    onSuccess: (createdTask, { insertBeforeTaskId }) => {
      const queryKey = taskQueryKey(projectId);
      const updatedTasks = [
        ...(queryClient.getQueryData<Task[]>(queryKey) ?? []),
        createdTask,
      ];
      queryClient.setQueryData(queryKey, updatedTasks);
      if (insertBeforeTaskId) {
        const taskIds = updatedTasks
          .filter((task) => task.parent_task_id === createdTask.parent_task_id)
          .sort((left, right) => left.position - right.position)
          .map((task) => task.id)
          .filter((taskId) => taskId !== createdTask.id);
        const insertIndex = taskIds.indexOf(insertBeforeTaskId);
        if (insertIndex >= 0) {
          taskIds.splice(insertIndex, 0, createdTask.id);
          reorderMutation.mutate({
            parent_task_id: createdTask.parent_task_id,
            task_ids: taskIds,
          });
        }
      }
      setNewTask(null);
      setQuickCreateOpen(false);
      setQuickCreateTitle("");
    },
  });

  const updateTask = (taskId: UUID, changes: TaskUpdate) => {
    updateMutation.mutate({ taskId, changes });
  };

  const submitNewTask = (draft: TaskDraft) => {
    if (!draft.title.trim() || createMutation.isPending) return;
    createMutation.mutate({
      body: {
        title: draft.title.trim(),
        description: null,
        status: draft.status,
        priority: draft.priority,
        start_at: dateValue(draft.startAt),
        due_at: dateValue(draft.dueAt),
        assignee_id: draft.assigneeId || null,
        reporter_id: draft.reporterId || null,
        parent_task_id: draft.parentTaskId,
      },
      insertBeforeTaskId: draft.insertBeforeTaskId,
    });
  };

  const submitQuickTask = (title: string) => {
    const t = title.trim();
    if (!t || createMutation.isPending) return;
    createMutation.mutate({
      body: {
        title: t,
        description: null,
        status: "todo",
        priority: "none",
        start_at: null,
        due_at: null,
        assignee_id: null,
        parent_task_id: null,
      },
    });
  };

  return {
    tasks: taskData.tasks,
    members: taskData.members,
    membersById: taskData.membersById,
    isPending: taskData.isPending,
    error: taskData.error,
    refetch: taskData.refetch,
    newTask,
    setNewTask,
    quickCreateOpen,
    setQuickCreateOpen,
    quickCreateTitle,
    setQuickCreateTitle,
    memberItems,
    updateTask,
    submitNewTask,
    submitQuickTask,
    updateError: updateMutation.error,
    reorderError: reorderMutation.error,
    createError: createMutation.error,
    createPending: createMutation.isPending,
    reorderPending: reorderMutation.isPending,
    reorderMutation,
  };
}
