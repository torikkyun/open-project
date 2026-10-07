import { useRef, useState } from "react";
import type { Task, TaskUpdate, UUID } from "@/api";
import { Input } from "@/components/ui/input";

// Giữ bản nháp tại chỗ: gõ tiêu đề không render lại cả bảng.
export function TaskTitleInput({
  task,
  updateTask,
}: {
  task: Task;
  updateTask: (taskId: UUID, changes: TaskUpdate) => void;
}) {
  const [draft, setDraft] = useState<string | null>(null);
  const canceledRef = useRef(false);

  return (
    <Input
      value={draft ?? task.title}
      aria-label={`Tiêu đề ${task.title}`}
      className="min-w-0 flex-1 truncate border-transparent bg-transparent shadow-none hover:border-input focus-visible:border-ring"
      onChange={(event) => setDraft(event.target.value)}
      onKeyDown={(event) => {
        if (event.key === "Enter") event.currentTarget.blur();
        if (event.key === "Escape") {
          canceledRef.current = true;
          event.currentTarget.blur();
        }
      }}
      onBlur={(event) => {
        const title = event.currentTarget.value.trim();
        setDraft(null);
        if (canceledRef.current) {
          canceledRef.current = false;
          return;
        }
        if (title && title !== task.title) updateTask(task.id, { title });
      }}
    />
  );
}
