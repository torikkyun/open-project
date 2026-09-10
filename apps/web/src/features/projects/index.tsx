import { useEffect, useMemo, useState } from "react";
import { projectsEndpoints } from "../../api/endpoints/projects";
import { templatesEndpoints } from "../../api/endpoints/templates";
import { usersEndpoints } from "../../api/endpoints/users";
import type { Project, Template, User } from "../../api/contracts";
import { Button, Combobox, Input, Select, Table } from "../../components/ui";
import { ProjectDetailPage as ProjectDetail } from "./project-detail";
import { ProjectFormDialog } from "./project-form-dialog";

const statuses = [
  { value: "", label: "Tất cả trạng thái" },
  { value: "not_started", label: "Chưa bắt đầu" },
  { value: "in_progress", label: "Đang thực hiện" },
  { value: "completed", label: "Đã hoàn thành" },
  { value: "archived", label: "Đã lưu trữ" },
] as const;

function formatDate(value?: string) {
  return value
    ? new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium" }).format(
        new Date(value),
      )
    : "-";
}

function statusLabel(status?: string) {
  return statuses.find((item) => item.value === status)?.label ?? status ?? "-";
}

export function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [managerId, setManagerId] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialog, setDialog] = useState<{
    open: boolean;
    project: Project | null;
  }>({ open: false, project: null });
  const pageSize = 10;

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    projectsEndpoints
      .list({
        limit: 100,
        search: search || undefined,
        status: status || undefined,
        manager_id: managerId || undefined,
      })
      .then((result) => active && setProjects(result))
      .catch(
        (cause: unknown) =>
          active &&
          setError(
            cause instanceof Error ? cause.message : "Không thể tải dự án",
          ),
      )
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [managerId, search, status]);

  useEffect(() => {
    Promise.all([
      usersEndpoints.list({ limit: 100 }),
      templatesEndpoints.list({ limit: 100 }),
    ])
      .then(([userResult, templateResult]) => {
        setUsers(userResult as unknown as User[]);
        setTemplates(templateResult as unknown as Template[]);
      })
      .catch(() => undefined);
  }, []);

  const pageCount = Math.max(1, Math.ceil(projects.length / pageSize));
  const visibleProjects = useMemo(
    () => projects.slice((page - 1) * pageSize, page * pageSize),
    [page, projects],
  );
  const managers = users.filter(
    (user) => user.role === "admin" || user.role === "project_manager",
  );

  function replaceProject(project: Project) {
    setProjects((current) =>
      current.some((item) => item.id === project.id)
        ? current.map((item) =>
            item.id === project.id ? { ...item, ...project } : item,
          )
        : [project, ...current],
    );
  }

  async function archive(project: Project) {
    if (!window.confirm(`Archive ${project.name}?`)) return;
    try {
      await projectsEndpoints.archive(project.id);
      setProjects((current) =>
        current.filter((item) => item.id !== project.id),
      );
    } catch (cause: unknown) {
      setError(
        cause instanceof Error ? cause.message : "Không thể lưu trữ dự án",
      );
    }
  }

  return (
    <section aria-labelledby="projects-title" className="space-y-xl">
      <div className="flex flex-col gap-md border-b border-hairline pb-lg md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="mt-xs text-headline" id="projects-title">
            Dự án
          </h1>
          <p className="mt-xs text-body-sm text-ink-muted">
            Tìm kiếm, lọc và quản lý các dự án trong phạm vi được phép xem.
          </p>
        </div>
        <Button onClick={() => setDialog({ open: true, project: null })}>
          Tạo dự án
        </Button>
      </div>
      <div
        className="grid gap-md border-b border-hairline pb-lg md:grid-cols-[minmax(14rem,1fr)_12rem_14rem]"
        role="search"
      >
        <label className="text-body-sm" htmlFor="project-search">
          Tìm kiếm
          <Input
            id="project-search"
            placeholder="Tên dự án"
            value={search}
            onChange={(event) => {
              setPage(1);
              setSearch(event.target.value);
            }}
          />
        </label>
        <label className="text-body-sm" htmlFor="project-status">
          Trạng thái
          <Select.Root
            items={statuses.map((item) => ({
              value: item.value,
              label: item.label,
            }))}
            value={status}
            onValueChange={(value) => {
              setPage(1);
              setStatus(value as string);
            }}
          >
            <Select.Trigger
              className="mt-xs text-sm w-full"
              aria-label="Trạng thái"
            />
            <Select.Portal>
              <Select.Positioner>
                <Select.Popup>
                  <Select.List>
                    {statuses.map((item) => (
                      <Select.Item key={item.value} value={item.value}>
                        {item.label}
                      </Select.Item>
                    ))}
                  </Select.List>
                </Select.Popup>
              </Select.Positioner>
            </Select.Portal>
          </Select.Root>
        </label>
        <label className="text-body-sm" htmlFor="project-manager">
          Người quản lý
          <Combobox.Root
            items={[
              { value: "", label: "Tất cả người quản lý" },
              ...managers.map((user) => ({ value: user.id, label: user.name })),
            ]}
            value={managerId}
            itemToStringLabel={(value) =>
              value === ""
                ? "Tất cả người quản lý"
                : (managers.find((user) => user.id === value)?.name ?? "")
            }
            onValueChange={(value) => {
              setPage(1);
              setManagerId(value as string);
            }}
          >
            <Combobox.InputGroup className="mt-xs">
              <Combobox.Input
                className="px-3 py-2 text-sm"
                placeholder="Tất cả người quản lý"
                aria-label="Người quản lý"
              />
              <Combobox.Clear aria-label="Xóa bộ lọc người quản lý" />
              <Combobox.Trigger aria-label="Mở danh sách người quản lý" />
            </Combobox.InputGroup>
            <Combobox.Portal>
              <Combobox.Positioner>
                <Combobox.Popup>
                  <Combobox.Empty>Không tìm thấy người quản lý</Combobox.Empty>
                  <Combobox.List>
                    <Combobox.Item value="">Tất cả người quản lý</Combobox.Item>
                    {managers.map((user) => (
                      <Combobox.Item key={user.id} value={user.id}>
                        {user.name}
                      </Combobox.Item>
                    ))}
                  </Combobox.List>
                </Combobox.Popup>
              </Combobox.Positioner>
            </Combobox.Portal>
          </Combobox.Root>
        </label>
      </div>
      {error ? (
        <p
          className="border border-error p-md text-body-sm text-error"
          role="alert"
        >
          {error}
        </p>
      ) : null}
      {loading ? (
        <p className="text-body-sm text-ink-muted" role="status">
          Đang tải dự án...
        </p>
      ) : null}
      {!loading && !error && !visibleProjects.length ? (
        <p className="border border-dashed border-hairline-strong p-xl text-body-sm text-ink-muted">
          Không có dự án phù hợp với bộ lọc.
        </p>
      ) : null}
      {!loading && visibleProjects.length ? (
        <Table.Container>
          <Table.Root className="min-w-[52rem] text-body-sm">
            <Table.Caption className="sr-only">Danh sách dự án</Table.Caption>
            <Table.Header className="text-caption uppercase text-ink-muted">
              <Table.Row>
                <Table.Head>Dự án</Table.Head>
                <Table.Head>Trạng thái</Table.Head>
                <Table.Head>Thời gian</Table.Head>
                <Table.Head>Công việc</Table.Head>
                <Table.Head className="text-right">Thao tác</Table.Head>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {visibleProjects.map((project) => (
                <Table.Row key={project.id}>
                  <Table.Cell className="p-md">
                    <a
                      className="font-semibold text-primary underline-offset-4 hover:underline"
                      href={`/projects/${project.id}`}
                    >
                      {project.name}
                    </a>
                    <p className="mt-xxs max-w-sm truncate text-ink-muted">
                      {project.description || "Chưa có mô tả"}
                    </p>
                  </Table.Cell>
                  <Table.Cell className="p-md">
                    {statusLabel(project.status)}
                  </Table.Cell>
                  <Table.Cell className="p-md whitespace-nowrap">
                    {formatDate(project.start_date)} -{" "}
                    {formatDate(project.end_date)}
                  </Table.Cell>
                  <Table.Cell className="p-md whitespace-nowrap">
                    {project.tasks_count ?? 0} công việc /{" "}
                    {project.members_count ?? 0} thành viên
                  </Table.Cell>
                  <Table.Cell className="p-md">
                    <div className="flex justify-end gap-xs">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setDialog({ open: true, project })}
                      >
                        Sửa
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => void archive(project)}
                      >
                        Lưu trữ
                      </Button>
                    </div>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table.Root>
        </Table.Container>
      ) : null}
      <div className="flex items-center justify-between text-body-sm text-ink-muted">
        <span>{projects.length} dự án</span>
        <div className="flex items-center gap-xs">
          <Button
            size="sm"
            variant="outline"
            disabled={page === 1}
            onClick={() => setPage((value) => value - 1)}
          >
            Trước
          </Button>
          <span>
            Trang {page} / {pageCount}
          </span>
          <Button
            size="sm"
            variant="outline"
            disabled={page >= pageCount}
            onClick={() => setPage((value) => value + 1)}
          >
            Sau
          </Button>
        </div>
      </div>
      <ProjectFormDialog
        open={dialog.open}
        project={dialog.project}
        users={users}
        templates={templates}
        onClose={() => setDialog({ open: false, project: null })}
        onSaved={replaceProject}
      />
    </section>
  );
}

export function ProjectDetailPage() {
  return <ProjectDetail />;
}
