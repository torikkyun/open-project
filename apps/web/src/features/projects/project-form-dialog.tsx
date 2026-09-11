import { useEffect, useState, type FormEvent } from "react";
import { projectsEndpoints } from "../../api/endpoints/projects";
import type { Project, Template, User } from "../../api/contracts";
import {
  Button,
  Checkbox,
  Dialog,
  Input,
  Select,
  Textarea,
} from "../../components/ui";

type ProjectForm = {
  name: string;
  description: string;
  start_date: string;
  end_date: string;
  template_id: string;
  member_ids: string[];
};

const emptyForm: ProjectForm = {
  name: "",
  description: "",
  start_date: "",
  end_date: "",
  template_id: "",
  member_ids: [],
};

export function ProjectFormDialog({
  open,
  project,
  users,
  templates,
  onClose,
  onSaved,
}: {
  open: boolean;
  project: Project | null;
  users: User[];
  templates: Template[];
  onClose: () => void;
  onSaved: (project: Project) => void;
}) {
  const [form, setForm] = useState(emptyForm);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setForm(
      project
        ? {
            name: project.name,
            description: project.description ?? "",
            start_date: project.start_date.slice(0, 10),
            end_date: project.end_date.slice(0, 10),
            template_id: project.template_id ?? "",
            member_ids: [],
          }
        : emptyForm,
    );
    setError(null);
  }, [project, open]);

  function update<K extends keyof ProjectForm>(key: K, value: ProjectForm[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      const result = project
        ? await projectsEndpoints.update(project.id, {
            name: form.name,
            description: form.description,
            start_date: form.start_date,
            end_date: form.end_date,
          })
        : await projectsEndpoints.create({
            ...form,
            template_id: form.template_id || undefined,
          });
      onSaved(result);
      onClose();
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : "Không thể lưu dự án");
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(nextOpen) => !nextOpen && onClose()}
    >
      <Dialog.Portal>
        <Dialog.Backdrop />
        <Dialog.Viewport>
          <Dialog.Popup>
            <Dialog.Title>{project ? "Sửa dự án" : "Tạo dự án"}</Dialog.Title>
            <Dialog.Description>
              Thiết lập thời gian, mẫu và thành viên ban đầu cho dự án.
            </Dialog.Description>
            <form className="space-y-md" onSubmit={submit}>
              <label className="block text-body-sm" htmlFor="project-name">
                Tên
                <Input
                  id="project-name"
                  required
                  value={form.name}
                  onChange={(event) => update("name", event.target.value)}
                />
              </label>
              <label
                className="block text-body-sm"
                htmlFor="project-description"
              >
                Mô tả
                <Textarea
                  id="project-description"
                  className="mt-xs min-h-24"
                  value={form.description}
                  onChange={(event) =>
                    update("description", event.target.value)
                  }
                />
              </label>
              <div className="grid gap-md sm:grid-cols-2">
                <label className="block text-body-sm" htmlFor="project-start">
                  Ngày bắt đầu
                  <Input
                    id="project-start"
                    required
                    type="date"
                    value={form.start_date}
                    onChange={(event) =>
                      update("start_date", event.target.value)
                    }
                  />
                </label>
                <label className="block text-body-sm" htmlFor="project-end">
                  Ngày kết thúc
                  <Input
                    id="project-end"
                    required
                    type="date"
                    value={form.end_date}
                    onChange={(event) => update("end_date", event.target.value)}
                  />
                </label>
              </div>
              {!project ? (
                <>
                  <label
                    className="block text-body-sm"
                    htmlFor="project-template"
                  >
                    Mẫu
                    <Select.Root
                      items={[
                        { value: "", label: "Không dùng mẫu" },
                        ...templates.map((template) => ({
                          value: template.id,
                          label: template.name,
                        })),
                      ]}
                      value={form.template_id}
                      onValueChange={(value) =>
                        update("template_id", value as string)
                      }
                    >
                      <Select.Trigger
                        className="mt-xs w-full"
                        aria-label="Mẫu"
                      />
                      <Select.Portal>
                        <Select.Positioner>
                          <Select.Popup>
                            <Select.List>
                              <Select.Item value="">Không dùng mẫu</Select.Item>
                              {templates.map((template) => (
                                <Select.Item
                                  key={template.id}
                                  value={template.id}
                                >
                                  {template.name}
                                </Select.Item>
                              ))}
                            </Select.List>
                          </Select.Popup>
                        </Select.Positioner>
                      </Select.Portal>
                    </Select.Root>
                  </label>
                  <fieldset>
                    <legend className="text-body-sm">Thành viên ban đầu</legend>
                    <div className="mt-xs grid max-h-32 gap-xs overflow-auto border border-hairline p-sm">
                      {users.map((user) => (
                        <label
                          className="flex items-center gap-xs text-body-sm"
                          key={user.id}
                        >
                          <Checkbox.Root
                            checked={form.member_ids.includes(user.id)}
                            onCheckedChange={(checked) =>
                              update(
                                "member_ids",
                                checked
                                  ? [...form.member_ids, user.id]
                                  : form.member_ids.filter(
                                      (id) => id !== user.id,
                                    ),
                              )
                            }
                          />
                          {user.name}{" "}
                          <span className="text-ink-muted">({user.email})</span>
                        </label>
                      ))}
                    </div>
                  </fieldset>
                </>
              ) : null}
              {error ? (
                <p
                  className="border border-error p-sm text-body-sm text-error"
                  role="alert"
                >
                  {error}
                </p>
              ) : null}
              <div className="flex justify-end gap-xs">
                <Button type="button" variant="ghost" onClick={onClose}>
                  Hủy
                </Button>
                <Button disabled={pending} type="submit">
                  {pending
                    ? "Đang lưu..."
                    : project
                      ? "Lưu thay đổi"
                      : "Tạo dự án"}
                </Button>
              </div>
            </form>
          </Dialog.Popup>
        </Dialog.Viewport>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
