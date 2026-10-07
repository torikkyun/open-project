import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef } from "react";
import { Paperclip, Trash2 } from "lucide-react";
import { api, type UUID } from "@/api";
import { Button } from "@/components/ui/button";

const attachmentQueryKey = (projectId: UUID, taskId: UUID) => [
  "task-attachments",
  projectId,
  taskId,
];

const sizeText = (bytes: number) =>
  bytes >= 1024 * 1024
    ? `${(bytes / 1024 / 1024).toFixed(1)} MB`
    : `${Math.max(1, Math.round(bytes / 1024))} KB`;

export function TaskAttachments({
  projectId,
  taskId,
  commentId,
}: {
  projectId: UUID;
  taskId: UUID;
  commentId?: UUID;
}) {
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const queryKey = attachmentQueryKey(projectId, taskId);
  const attachmentsQuery = useQuery({
    queryKey,
    queryFn: () => api.listAttachments(projectId, taskId),
  });
  const uploadMutation = useMutation({
    mutationFn: (file: File) =>
      api.createAttachment(projectId, taskId, file, commentId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });
  const deleteMutation = useMutation({
    mutationFn: (attachmentId: UUID) =>
      api.deleteAttachment(projectId, taskId, attachmentId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  const attachments = (attachmentsQuery.data ?? []).filter(
    (item) => item.comment_id === (commentId ?? null),
  );
  const error =
    uploadMutation.error ?? deleteMutation.error ?? attachmentsQuery.error;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-medium">Tệp đính kèm</h3>
        <input
          ref={fileRef}
          type="file"
          className="sr-only"
          aria-label="Chọn tệp đính kèm"
          accept=".pdf,.zip,.jpg,.jpeg,.png,.webp,.gif,.doc,.docx,.xls,.xlsx"
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = "";
            if (file) uploadMutation.mutate(file);
          }}
        />
        <Button
          type="button"
          variant="ghost"
          size="xs"
          disabled={uploadMutation.isPending}
          onClick={() => fileRef.current?.click()}
        >
          <Paperclip data-icon="inline-start" />
          {uploadMutation.isPending ? "Đang tải..." : "Đính kèm"}
        </Button>
      </div>

      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error.message}
        </p>
      )}

      {attachmentsQuery.isPending ? (
        <p className="text-sm text-muted-foreground">Đang tải tệp...</p>
      ) : attachments.length ? (
        <ul className="flex flex-col gap-1">
          {attachments.map((item) => (
            <li key={item.id} className="flex items-center gap-2 text-sm">
              {/* ponytail: tải bằng link để trình duyệt tự lo tệp lớn; đổi sang fetch blob nếu cookie chuyển sang SameSite=strict. */}
              <a
                href={api.attachmentDownloadUrl(projectId, taskId, item.id)}
                download={item.original_name}
                className="min-w-0 flex-1 truncate text-primary hover:underline"
              >
                {item.original_name}
              </a>
              <span className="shrink-0 text-xs text-muted-foreground">
                {sizeText(item.size_bytes)}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                disabled={deleteMutation.isPending}
                aria-label={`Xóa tệp ${item.original_name}`}
                onClick={() => deleteMutation.mutate(item.id)}
              >
                <Trash2 />
              </Button>
            </li>
          ))}
        </ul>
      ) : (
        !commentId && (
          <p className="text-sm text-muted-foreground">Chưa có tệp đính kèm.</p>
        )
      )}
    </div>
  );
}
