import type { TaskStatus, User } from "@/api";
import { Input } from "@/components/ui/input";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { statuses } from "../../constants/task";

export function TaskListFilters({
  search,
  setSearch,
  assigneeFilter,
  setAssigneeFilter,
  statusFilter,
  setStatusFilter,
  members,
}: {
  search: string;
  setSearch: (v: string) => void;
  assigneeFilter: string;
  setAssigneeFilter: (v: string) => void;
  statusFilter: "all" | TaskStatus;
  setStatusFilter: (v: "all" | TaskStatus) => void;
  members: User[];
}) {
  return (
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
      <NativeSelect
        value={statusFilter}
        onChange={(event) =>
          setStatusFilter(event.target.value as "all" | TaskStatus)
        }
        aria-label="Lọc theo trạng thái"
        className="min-w-36"
      >
        <NativeSelectOption value="all">Tất cả trạng thái</NativeSelectOption>
        {statuses.map((item) => (
          <NativeSelectOption key={item.value} value={item.value}>
            {item.label}
          </NativeSelectOption>
        ))}
      </NativeSelect>
    </div>
  );
}
