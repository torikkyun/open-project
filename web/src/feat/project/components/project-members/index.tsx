import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Trash2 } from "lucide-react";

import { api, type Project, type UUID } from "@/api";
import { useAuth } from "@/components/auth-provider";
import { UserAvatar } from "@/components/user-avatar";
import { Button } from "@/components/ui/button";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import { memberQueryKey } from "../../constants/task";

const candidateQueryKey = (projectId: UUID) => [
  "project-member-candidates",
  projectId,
];

export function ProjectMembers({ project }: { project: Project }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<UUID | null>(null);
  const isOwner = user?.id === project.owner_id;

  const membersQuery = useQuery({
    queryKey: memberQueryKey(project.id),
    queryFn: () => api.listMembers(project.id),
  });
  const candidatesQuery = useQuery({
    queryKey: candidateQueryKey(project.id),
    queryFn: () => api.listMemberCandidates(project.id),
    enabled: isOwner,
  });
  const members = membersQuery.data ?? [];
  const candidates = candidatesQuery.data ?? [];

  function refresh() {
    setSelected(null);
    void queryClient.invalidateQueries({ queryKey: memberQueryKey(project.id) });
    void queryClient.invalidateQueries({
      queryKey: candidateQueryKey(project.id),
    });
  }

  const addMutation = useMutation({
    mutationFn: (userId: UUID) => api.addMember(project.id, userId),
    onSuccess: refresh,
  });
  const removeMutation = useMutation({
    mutationFn: (userId: UUID) => api.removeMember(project.id, userId),
    onSuccess: refresh,
  });
  const error =
    membersQuery.error ??
    addMutation.error ??
    removeMutation.error ??
    candidatesQuery.error;

  return (
    <section className="flex min-h-0 min-w-0 flex-1 flex-col gap-3 overflow-auto rounded-lg border bg-background p-3">
      {isOwner ? (
        <Combobox
          items={candidates.map((candidate) => candidate.id)}
          value={selected}
          itemToStringLabel={(id) =>
            candidates.find((candidate) => candidate.id === id)?.full_name ?? ""
          }
          autoHighlight
          onValueChange={(id) => {
            setSelected(id);
            if (id) addMutation.mutate(id);
          }}
        >
          <ComboboxInput
            aria-label="Thêm thành viên vào dự án"
            placeholder="Thêm thành viên theo tên hoặc email"
            className="w-full min-w-0 sm:max-w-sm"
            disabled={addMutation.isPending}
          />
          <ComboboxContent>
            <ComboboxEmpty>Không còn tài khoản nào để thêm.</ComboboxEmpty>
            <ComboboxList>
              {candidates.map((candidate) => (
                <ComboboxItem key={candidate.id} value={candidate.id}>
                  <UserAvatar user={candidate} />
                  {candidate.full_name} · {candidate.email}
                </ComboboxItem>
              ))}
            </ComboboxList>
          </ComboboxContent>
        </Combobox>
      ) : (
        <p className="text-sm text-muted-foreground">
          Chỉ chủ sở hữu dự án mới thêm được thành viên.
        </p>
      )}

      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error.message}
        </p>
      )}

      {membersQuery.isPending ? (
        <p className="text-sm text-muted-foreground">Đang tải thành viên...</p>
      ) : members.length ? (
        <ul className="flex flex-col divide-y">
          {members.map((member) => (
            <li
              key={member.id}
              className="flex min-w-0 items-center gap-3 py-2 first:pt-0"
            >
              <UserAvatar user={member} />
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate font-medium">
                  {member.full_name}
                </span>
                <span className="truncate text-sm text-muted-foreground">
                  {member.email}
                </span>
              </span>
              {member.id === project.owner_id ? (
                <span className="shrink-0 text-sm text-muted-foreground">
                  Chủ sở hữu
                </span>
              ) : (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="shrink-0"
                  aria-label={`Xóa ${member.full_name} khỏi dự án`}
                  title="Xóa khỏi dự án"
                  disabled={!isOwner || removeMutation.isPending}
                  onClick={() => removeMutation.mutate(member.id)}
                >
                  <Trash2 aria-hidden="true" />
                </Button>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">
          Chưa có thành viên nào.
        </p>
      )}
    </section>
  );
}
