import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { api, type User, type UUID } from "@/api";
import { memberQueryKey, taskQueryKey } from "../constants/task";

export function useProjectTaskData(projectId: UUID) {
  const tasksQuery = useQuery({
    queryKey: taskQueryKey(projectId),
    queryFn: () => api.listAllTasks(projectId),
  });
  const membersQuery = useQuery({
    queryKey: memberQueryKey(projectId),
    queryFn: () => api.listMembers(projectId),
  });
  const tasks = tasksQuery.data ?? [];
  const members = membersQuery.data ?? [];
  const membersById = useMemo(
    () =>
      new Map<UUID, User>(
        (membersQuery.data ?? []).map(
          (member): [UUID, User] => [member.id, member],
        ),
      ),
    [membersQuery.data],
  );

  return {
    tasks,
    members,
    membersById,
    isPending: tasksQuery.isPending || membersQuery.isPending,
    error: tasksQuery.error ?? membersQuery.error,
    refetch: tasksQuery.refetch,
  };
}
