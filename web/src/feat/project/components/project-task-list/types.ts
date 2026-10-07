import type { Dispatch, SetStateAction } from "react";
import type {
  Task,
  TaskPriority,
  TaskStatus,
  TaskUpdate,
  UUID,
  User,
} from "@/api";

export type TaskDraft = {
  parentTaskId: UUID | null;
  insertBeforeTaskId?: UUID;
  title: string;
  assigneeId: string;
  reporterId: string;
  priority: TaskPriority;
  status: TaskStatus;
  startAt: string;
  dueAt: string;
};

export type TaskListContext = {
  canReorder: boolean;
  collapsedTasks: Record<UUID, true>;
  allTasksCollapsed: boolean;
  parentTaskIds: UUID[];
  members: User[];
  membersById: Map<UUID, User>;
  rowSelection: Record<string, true>;
  allTasks: Task[];
  byId: Map<UUID, Task>;
  visibleTasks: Task[];
  children: Map<UUID, Task[]>;
  memberItems: string[];
  shortProjectKey: string;
  newTask: TaskDraft | null;
  quickCreateOpen: boolean;
  reorderPending: boolean;
  setRowSelection: Dispatch<SetStateAction<Record<string, true>>>;
  setCollapsedTasks: Dispatch<SetStateAction<Record<UUID, true>>>;
  setNewTask: Dispatch<SetStateAction<TaskDraft | null>>;
  updateTask: (taskId: UUID, changes: TaskUpdate) => void;
  toggleAllTasks: () => void;
  childrenHidden: boolean;
};
