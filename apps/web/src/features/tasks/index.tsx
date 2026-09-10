import { useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { commentsEndpoints } from "../../api/endpoints/comments";
import { documentsEndpoints } from "../../api/endpoints/documents";
import { notificationsEndpoints } from "../../api/endpoints/notifications";
import { tasksEndpoints } from "../../api/endpoints/tasks";
import type {
  Attachment,
  Comment,
  Notification,
  Task,
  TaskHistory,
} from "../../api/contracts";

const taskStatusLabels: Record<string, string> = {
  todo: "Cần làm",
  in_progress: "Đang thực hiện",
  review: "Chờ duyệt",
  done: "Hoàn thành",
  canceled: "Đã hủy",
};

function dateLabel(value?: string) {
  return value ? new Date(value).toLocaleString("vi-VN") : "";
}

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

export function TaskDetailPage() {
  const { taskId } = useParams({ from: "/_authenticated/tasks/$taskId" });
  const [task, setTask] = useState<Task | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [history, setHistory] = useState<TaskHistory[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [comment, setComment] = useState("");
  const [replyTo, setReplyTo] = useState<string | undefined>();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadCollaboration() {
    const [
      taskResult,
      commentResult,
      attachmentResult,
      historyResult,
      notificationResult,
    ] = await Promise.all([
      tasksEndpoints.getById(taskId),
      commentsEndpoints.list(taskId),
      documentsEndpoints.listTask(taskId),
      tasksEndpoints.getHistory(taskId),
      notificationsEndpoints.list({ limit: 10 }),
    ]);
    setTask(taskResult);
    setComments(commentResult);
    setAttachments(attachmentResult);
    setHistory(historyResult);
    setNotifications(notificationResult);
  }

  useEffect(() => {
    let active = true;
    setLoading(true);
    loadCollaboration()
      .catch((cause: unknown) => {
        if (active)
          setError(
            cause instanceof Error ? cause.message : "Không thể tải công việc",
          );
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [taskId]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      notificationsEndpoints
        .list({ limit: 10 })
        .then(setNotifications)
        .catch(() => undefined);
    }, 30_000);
    return () => window.clearInterval(timer);
  }, []);

  async function submitComment(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!comment.trim()) return;
    try {
      const result = await commentsEndpoints.create(taskId, {
        content: comment.trim(),
        parent_comment_id: replyTo,
      });
      setComments((current) => [...current, result]);
      setComment("");
      setReplyTo(undefined);
    } catch (cause: unknown) {
      setError(
        cause instanceof Error ? cause.message : "Không thể thêm bình luận",
      );
    }
  }

  async function upload(file: File) {
    const formData = new FormData();
    formData.append("file", file);
    try {
      await documentsEndpoints.uploadTask(taskId, formData);
      setAttachments(await documentsEndpoints.listTask(taskId));
    } catch (cause: unknown) {
      setError(
        cause instanceof Error ? cause.message : "Không thể tải tệp lên",
      );
    }
  }

  async function markAllRead() {
    await notificationsEndpoints.markAllRead();
    setNotifications((current) =>
      current.map((item) => ({ ...item, is_read: true })),
    );
  }

  if (loading) return <p role="status">Đang tải công việc...</p>;
  if (!task) return <p role="alert">{error ?? "Không tìm thấy công việc"}</p>;

  return (
    <section aria-labelledby="task-title" className="space-y-xl">
      <header className="border-b border-hairline pb-lg">
        <p className="text-eyebrow uppercase text-primary">
          Cộng tác công việc
        </p>
        <h1 className="mt-xs text-headline" id="task-title">
          {task.title}
        </h1>
        <p className="mt-xs text-body-sm text-ink-muted">
          {task.description || "Chưa có mô tả"}
        </p>
        <div className="mt-md flex flex-wrap gap-md text-body-sm text-ink-muted">
          <span>
            Trạng thái: {taskStatusLabels[task.status] ?? task.status}
          </span>
          <span>Tiến độ: {task.progress_percent ?? 0}%</span>
          <span>
            {task.start_date} - {task.end_date}
          </span>
        </div>
      </header>
      {error ? (
        <p
          className="border border-error p-md text-body-sm text-error"
          role="alert"
        >
          {error}
        </p>
      ) : null}
      <div className="grid gap-xl lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-xl">
          <section
            className="border border-hairline bg-canvas p-lg"
            aria-labelledby="comments-title"
          >
            <h2 className="text-subhead" id="comments-title">
              Bình luận
            </h2>
            <ul className="mt-md space-y-md">
              {comments.map((item) => (
                <li className="border-l-2 border-primary pl-md" key={item.id}>
                  <p className="text-body-sm">{item.content}</p>
                  <p className="mt-xxs text-caption text-ink-muted">
                    {item.user?.name ?? "Người dùng"} ·{" "}
                    {dateLabel(item.created_at)}
                  </p>
                  {item.attachments?.map((file) => (
                    <button
                      className="mt-xs mr-xs text-body-sm text-primary underline"
                      key={file.id}
                      type="button"
                      onClick={() =>
                        documentsEndpoints
                          .download(file.id)
                          .then((blob) =>
                            downloadBlob(blob, file.file_name ?? "download"),
                          )
                      }
                    >
                      {file.file_name}
                    </button>
                  ))}
                  <button
                    className="mt-xs block text-caption text-primary underline"
                    type="button"
                    onClick={() => setReplyTo(item.id)}
                  >
                    Trả lời
                  </button>
                </li>
              ))}
            </ul>
            <form className="mt-lg space-y-sm" onSubmit={submitComment}>
              <label className="text-body-sm" htmlFor="task-comment">
                {replyTo ? "Trả lời" : "Thêm bình luận"}
              </label>
              <textarea
                className="min-h-24 w-full border border-hairline p-sm"
                id="task-comment"
                value={comment}
                onChange={(event) => setComment(event.target.value)}
              />
              <div className="flex gap-sm">
                <button
                  className="bg-primary px-md py-xs text-button text-on-primary"
                  type="submit"
                >
                  Đăng bình luận
                </button>
                {replyTo ? (
                  <button
                    className="border border-hairline px-md py-xs text-button"
                    type="button"
                    onClick={() => setReplyTo(undefined)}
                  >
                    Hủy trả lời
                  </button>
                ) : null}
              </div>
            </form>
          </section>
          <section
            className="border border-hairline bg-canvas p-lg"
            aria-labelledby="files-title"
          >
            <div className="flex flex-wrap items-center justify-between gap-md">
              <h2 className="text-subhead" id="files-title">
                Tệp
              </h2>
              <label className="bg-primary px-md py-xs text-button text-on-primary">
                Tải lên
                <input
                  className="sr-only"
                  type="file"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) void upload(file);
                  }}
                />
              </label>
            </div>
            <ul className="mt-md divide-y divide-hairline">
              {attachments.map((file) => (
                <li
                  className="flex flex-wrap items-center justify-between gap-sm py-sm"
                  key={file.id}
                >
                  <span className="text-body-sm">{file.file_name}</span>
                  <button
                    className="text-body-sm text-primary underline"
                    type="button"
                    onClick={() =>
                      documentsEndpoints
                        .download(file.id)
                        .then((blob) =>
                          downloadBlob(blob, file.file_name ?? "download"),
                        )
                    }
                  >
                    Tải xuống
                  </button>
                </li>
              ))}
            </ul>
            {!attachments.length ? (
              <p className="mt-md text-body-sm text-ink-muted">Chưa có tệp.</p>
            ) : null}
          </section>
        </div>
        <aside className="space-y-xl">
          <section
            className="border border-hairline bg-canvas p-lg"
            aria-labelledby="history-title"
          >
            <h2 className="text-subhead" id="history-title">
              Lịch sử
            </h2>
            <ul className="mt-md space-y-sm">
              {history.map((entry) => (
                <li
                  className="border-b border-hairline pb-sm text-body-sm"
                  key={entry.id}
                >
                  <strong>{entry.action}</strong>
                  <span className="ml-xs text-ink-muted">
                    {entry.actor?.name ?? "Hệ thống"}
                  </span>
                  <p className="text-caption text-ink-muted">
                    {dateLabel(entry.createdAt)}
                  </p>
                </li>
              ))}
            </ul>
          </section>
          <section
            className="border border-hairline bg-canvas p-lg"
            aria-labelledby="notifications-title"
          >
            <div className="flex items-center justify-between gap-sm">
              <h2 className="text-subhead" id="notifications-title">
                Thông báo
              </h2>
              <button
                className="text-body-sm text-primary underline"
                type="button"
                onClick={() => void markAllRead()}
              >
                Đánh dấu tất cả đã đọc
              </button>
            </div>
            <ul className="mt-md divide-y divide-hairline">
              {notifications.map((item) => (
                <li
                  className={`py-sm ${item.is_read ? "text-ink-muted" : "font-semibold"}`}
                  key={item.id}
                >
                  <button
                    className="text-left text-body-sm"
                    type="button"
                    onClick={() =>
                      notificationsEndpoints
                        .markRead(item.id)
                        .then(() =>
                          setNotifications((current) =>
                            current.map((notification) =>
                              notification.id === item.id
                                ? { ...notification, is_read: true }
                                : notification,
                            ),
                          ),
                        )
                    }
                  >
                    {item.content}
                  </button>
                </li>
              ))}
            </ul>
            {!notifications.length ? (
              <p className="mt-md text-body-sm text-ink-muted">
                Chưa có thông báo.
              </p>
            ) : null}
          </section>
        </aside>
      </div>
    </section>
  );
}
