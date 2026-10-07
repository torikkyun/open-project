import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Trash2 } from "lucide-react";
import {
  api,
  type Comment,
  type Task,
  type TaskPriority,
  type TaskStatus,
  type TaskUpdate,
  type UUID,
  type User,
} from "@/api";
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
import { FieldLabel, FieldTitle } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { InputGroupAddon } from "@/components/ui/input-group";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { priorities, statuses } from "../../constants/task";
import { projectKeyPrefix } from "../../utils/task";
import { dateInputValue, dateValue } from "../project-task-list/utils";
import { TaskAttachments } from "./attachments";

export function TaskKeyButton({
  label,
  onOpen,
}: {
  label: string;
  onOpen: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="shrink-0 whitespace-nowrap text-primary underline-offset-2 hover:underline focus-visible:underline"
    >
      {label}
    </button>
  );
}

function dateText(value: string) {
  return new Date(value).toLocaleDateString("vi-VN");
}

function MemberCombobox({
  label,
  value,
  members,
  membersById,
  clearable,
  onChange,
}: {
  label: string;
  value: string;
  members: User[];
  membersById: Map<UUID, User>;
  clearable?: boolean;
  onChange: (memberId: string) => void;
}) {
  const memberIds = useMemo(() => members.map((member) => member.id), [members]);

  return (
    <Combobox
      items={clearable ? ["", ...memberIds] : memberIds}
      value={value}
      itemToStringLabel={(id) =>
        membersById.get(id)?.full_name ?? (clearable ? "Chưa phân công" : "")
      }
      autoHighlight
      onValueChange={(memberId) => onChange(memberId ?? "")}
    >
      <ComboboxInput
        aria-label={label}
        placeholder={clearable ? "Chưa phân công" : "Chọn người báo cáo"}
        className="w-full min-w-0 sm:max-w-64"
        showClear={clearable}
      >
        <InputGroupAddon align="inline-start">
          <UserAvatar user={value ? membersById.get(value) : null} />
        </InputGroupAddon>
      </ComboboxInput>
      <ComboboxContent>
        <ComboboxEmpty>Không tìm thấy người phù hợp.</ComboboxEmpty>
        <ComboboxList>
          {clearable && <ComboboxItem value="">Chưa phân công</ComboboxItem>}
          {members.map((member) => (
            <ComboboxItem key={member.id} value={member.id}>
              <UserAvatar user={member} />
              {member.full_name}
            </ComboboxItem>
          ))}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}

function TaskDetail({
  projectId,
  projectKey,
  task,
  parentTask,
  members,
  membersById,
  updateTask,
}: {
  projectId: UUID;
  projectKey: string;
  task: Task;
  parentTask: Task | null;
  members: User[];
  membersById: Map<UUID, User>;
  updateTask: (taskId: UUID, changes: TaskUpdate) => void;
}) {
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description ?? "");
  const prefix = projectKeyPrefix(projectKey).toUpperCase();
  const key = `${prefix}-${task.task_number}`;
  const creator = membersById.get(task.created_by);

  return (
    <>
      <SheetHeader className="gap-3 border-b">
        <SheetTitle className="text-primary">{key}</SheetTitle>
        <Input
          value={title}
          aria-label={`Tiêu đề ${key}`}
          maxLength={200}
          className="border-transparent bg-transparent text-base font-medium shadow-none hover:border-input focus-visible:border-ring"
          onChange={(event) => setTitle(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") event.currentTarget.blur();
            if (event.key === "Escape") {
              setTitle(task.title);
              event.currentTarget.blur();
            }
          }}
          onBlur={() => {
            const next = title.trim();
            if (!next || next === task.title) {
              setTitle(task.title);
              return;
            }
            updateTask(task.id, { title: next });
          }}
        />
        {parentTask && (
          <p className="text-sm text-muted-foreground">
            Công việc cha: {prefix}-{parentTask.task_number} {parentTask.title}
          </p>
        )}
      </SheetHeader>

      <div className="min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto">
        <div className="grid min-w-0 gap-3 p-4 sm:grid-cols-[9rem_minmax(0,1fr)] sm:items-center">
          <FieldTitle>Người thực hiện</FieldTitle>
          <MemberCombobox
            label={`Người thực hiện ${key}`}
            value={task.assignee_id ?? ""}
            members={members}
            membersById={membersById}
            clearable
            onChange={(assigneeId) =>
              updateTask(task.id, { assignee_id: assigneeId || null })
            }
          />

          <FieldTitle>Người báo cáo</FieldTitle>
          <MemberCombobox
            label={`Người báo cáo ${key}`}
            value={task.reporter_id}
            members={members}
            membersById={membersById}
            onChange={(reporterId) => {
              if (reporterId) {
                updateTask(task.id, { reporter_id: reporterId });
              }
            }}
          />

          <FieldLabel htmlFor="task-detail-status">Trạng thái</FieldLabel>
          <NativeSelect
            id="task-detail-status"
            value={task.status}
            className="min-w-0 sm:max-w-64"
            onChange={(event) =>
              updateTask(task.id, { status: event.target.value as TaskStatus })
            }
          >
            {statuses.map((item) => (
              <NativeSelectOption key={item.value} value={item.value}>
                {item.label}
              </NativeSelectOption>
            ))}
          </NativeSelect>

          <FieldLabel htmlFor="task-detail-priority">Độ ưu tiên</FieldLabel>
          <NativeSelect
            id="task-detail-priority"
            value={task.priority}
            className="min-w-0 sm:max-w-64"
            onChange={(event) =>
              updateTask(task.id, {
                priority: event.target.value as TaskPriority,
              })
            }
          >
            {priorities.map((item) => (
              <NativeSelectOption key={item.value} value={item.value}>
                {item.label}
              </NativeSelectOption>
            ))}
          </NativeSelect>

          <FieldLabel htmlFor="task-detail-start">Ngày bắt đầu</FieldLabel>
          <Input
            id="task-detail-start"
            type="date"
            value={dateInputValue(task.start_at)}
            className="min-w-0 sm:max-w-64"
            onChange={(event) =>
              updateTask(task.id, { start_at: dateValue(event.target.value) })
            }
          />

          <FieldLabel htmlFor="task-detail-due">Hạn chót</FieldLabel>
          <Input
            id="task-detail-due"
            type="date"
            value={dateInputValue(task.due_at)}
            max={parentTask ? dateInputValue(parentTask.due_at) : undefined}
            className="min-w-0 sm:max-w-64"
            onChange={(event) =>
              updateTask(task.id, { due_at: dateValue(event.target.value) })
            }
          />

          <FieldTitle>Người tạo</FieldTitle>
          <span className="flex items-center gap-2 text-sm text-muted-foreground">
            <UserAvatar user={creator} />
            {creator?.full_name ?? "Không rõ"}
          </span>

          <FieldTitle>Thời gian</FieldTitle>
          <span className="text-sm text-muted-foreground">
            Tạo {dateText(task.created_at)} · Cập nhật{" "}
            {dateText(task.updated_at)}
          </span>
        </div>

        <Separator />
        <div className="flex flex-col gap-2 p-4">
          <h3 className="text-sm font-medium">Mô tả</h3>
          <Textarea
            value={description}
            aria-label={`Mô tả ${key}`}
            placeholder="Thêm mô tả cho công việc"
            maxLength={10_000}
            onChange={(event) => setDescription(event.target.value)}
            onBlur={() => {
              const next = description.trim();
              if (next === (task.description ?? "")) return;
              updateTask(task.id, { description: next || null });
            }}
          />
        </div>

        <Separator />
        <div className="p-4">
          <TaskAttachments projectId={projectId} taskId={task.id} />
        </div>

        <Separator />
        <TaskComments
          projectId={projectId}
          taskId={task.id}
          membersById={membersById}
        />
      </div>
    </>
  );
}

function TaskComments({
  projectId,
  taskId,
  membersById,
}: {
  projectId: UUID;
  taskId: UUID;
  membersById: Map<UUID, User>;
}) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [body, setBody] = useState("");
  const queryKey = ["task-comments", projectId, taskId];
  const commentsQuery = useQuery({
    queryKey,
    queryFn: () => api.listComments(projectId, taskId),
  });
  const createMutation = useMutation({
    mutationFn: (text: string) =>
      api.createComment(projectId, taskId, { body: text }),
    onSuccess: (comment) => {
      queryClient.setQueryData<Comment[]>(queryKey, (comments) => [
        ...(comments ?? []),
        comment,
      ]);
      setBody("");
    },
  });
  const deleteMutation = useMutation({
    mutationFn: (commentId: UUID) =>
      api.deleteComment(projectId, taskId, commentId),
    onSuccess: (_result, commentId) =>
      queryClient.setQueryData<Comment[]>(queryKey, (comments) =>
        comments?.filter((comment) => comment.id !== commentId),
      ),
  });

  const comments = commentsQuery.data ?? [];
  const error =
    createMutation.error ?? deleteMutation.error ?? commentsQuery.error;

  function submit() {
    const text = body.trim();
    if (!text || createMutation.isPending) return;
    createMutation.mutate(text);
  }

  return (
    <div className="flex flex-col gap-3 p-4">
      <h3 className="text-sm font-medium">Bình luận ({comments.length})</h3>

      {commentsQuery.isPending ? (
        <p className="text-sm text-muted-foreground">Đang tải bình luận...</p>
      ) : comments.length ? (
        <ul className="flex flex-col gap-3">
          {comments.map((comment) => {
            const author = membersById.get(comment.author_id);
            return (
              <li key={comment.id} className="flex gap-2">
                <UserAvatar user={author} />
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium">
                      {author?.full_name ?? "Không rõ"}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {dateText(comment.created_at)}
                    </span>
                    {(user?.id === comment.author_id ||
                      user?.role === "admin") && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-xs"
                        className="ml-auto"
                        disabled={deleteMutation.isPending}
                        aria-label="Xóa bình luận"
                        onClick={() => deleteMutation.mutate(comment.id)}
                      >
                        <Trash2 />
                      </Button>
                    )}
                  </div>
                  <p className="text-sm whitespace-pre-wrap">{comment.body}</p>
                  <TaskAttachments
                    projectId={projectId}
                    taskId={taskId}
                    commentId={comment.id}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">Chưa có bình luận.</p>
      )}

      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error.message}
        </p>
      )}

      <div className="flex flex-col gap-2">
        <Textarea
          value={body}
          aria-label="Nội dung bình luận"
          placeholder="Viết bình luận, nhấn Enter để gửi"
          maxLength={10_000}
          onChange={(event) => setBody(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              submit();
            }
          }}
        />
        <Button
          type="button"
          size="sm"
          className="self-end"
          disabled={!body.trim() || createMutation.isPending}
          onClick={submit}
        >
          {createMutation.isPending ? "Đang gửi..." : "Gửi bình luận"}
        </Button>
      </div>
    </div>
  );
}

export function TaskDetailSheet({
  projectId,
  projectKey,
  task,
  parentTask,
  members,
  membersById,
  updateTask,
  onClose,
}: {
  projectId: UUID;
  projectKey: string;
  task: Task | null;
  parentTask: Task | null;
  members: User[];
  membersById: Map<UUID, User>;
  updateTask: (taskId: UUID, changes: TaskUpdate) => void;
  onClose: () => void;
}) {
  return (
    <Sheet
      open={task !== null}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <SheetContent side="right" className="w-full gap-0 p-0 sm:max-w-xl">
        {task && (
          <TaskDetail
            key={task.id}
            projectId={projectId}
            projectKey={projectKey}
            task={task}
            parentTask={parentTask}
            members={members}
            membersById={membersById}
            updateTask={updateTask}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}
