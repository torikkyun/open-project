import { useEffect, useState, type FormEvent } from "react";
import { departmentsEndpoints } from "../../api/endpoints/departments";
import { templatesEndpoints } from "../../api/endpoints/templates";
import { usersEndpoints } from "../../api/endpoints/users";
import type { Department, Template, User, UserRole } from "../../api/contracts";
import { Button, Input, Table } from "../../components/ui";

const roles: UserRole[] = ["admin", "project_manager", "member", "guest"];
type AdminItem = User | Department | Template;

function AdminForm({
  kind,
  item,
  onSaved,
}: {
  kind: "users" | "departments" | "templates";
  item: AdminItem | null;
  onSaved: (item: AdminItem) => void;
}) {
  const [name, setName] = useState(item && "name" in item ? item.name : "");
  const [email, setEmail] = useState(item && "email" in item ? item.email : "");
  const [role, setRole] = useState<UserRole>(
    item && "role" in item ? item.role : "member",
  );
  const [description, setDescription] = useState(
    item && "description" in item ? (item.description ?? "") : "",
  );
  const [taskLines, setTaskLines] = useState(
    item && "tasks" in item
      ? (item.tasks ?? []).map((task) => task.title).join("\n")
      : "",
  );
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      let saved: AdminItem;
      if (kind === "users") {
        const payload = { name, email, role };
        saved =
          item && "id" in item
            ? await usersEndpoints.update(item.id, payload)
            : await usersEndpoints.create(payload);
      } else if (kind === "departments") {
        saved =
          item && "id" in item
            ? await departmentsEndpoints.update(item.id, { name })
            : await departmentsEndpoints.create({ name });
      } else {
        const payload = {
          name,
          description,
          tasks: taskLines
            .split("\n")
            .map((title) => title.trim())
            .filter(Boolean)
            .map((title) => ({ title })),
        };
        saved =
          item && "id" in item
            ? await templatesEndpoints.update(item.id, payload)
            : await templatesEndpoints.create(payload);
      }
      onSaved(saved);
      if (!item) {
        setName("");
        setEmail("");
        setDescription("");
        setTaskLines("");
      }
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : "Unable to save");
    } finally {
      setPending(false);
    }
  }

  return (
    <form
      className="grid gap-sm border border-hairline bg-surface-1 p-md md:grid-cols-[1fr_1fr_auto]"
      onSubmit={submit}
    >
      <label className="text-body-sm">
        Name
        <Input
          required
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
      </label>
      {kind === "users" ? (
        <label className="text-body-sm">
          Email
          <Input
            required
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </label>
      ) : null}
      {kind === "users" ? (
        <label className="text-body-sm">
          Role
          <select
            className="mt-xs min-h-12 w-full border-b border-hairline-strong bg-surface-1 px-md"
            value={role}
            onChange={(event) => setRole(event.target.value as UserRole)}
          >
            {roles.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>
      ) : null}
      {kind === "templates" ? (
        <label className="text-body-sm md:col-span-2">
          Description
          <textarea
            className="mt-xs min-h-20 w-full border border-hairline bg-surface-1 p-sm"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
        </label>
      ) : null}
      {kind === "templates" ? (
        <label className="text-body-sm md:col-span-2">
          Task structure
          <textarea
            className="mt-xs min-h-24 w-full border border-hairline bg-surface-1 p-sm"
            placeholder="One task title per line"
            value={taskLines}
            onChange={(event) => setTaskLines(event.target.value)}
          />
        </label>
      ) : null}
      <div className="flex items-end">
        <Button disabled={pending} type="submit">
          {pending ? "Saving..." : item ? "Save" : "Add"}
        </Button>
      </div>
      {error ? (
        <p className="text-body-sm text-error md:col-span-full" role="alert">
          {error}
        </p>
      ) : null}
    </form>
  );
}

export function AdminPage({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  const kind = title.toLowerCase() as "users" | "departments" | "templates";
  const [items, setItems] = useState<AdminItem[]>([]);
  const [editing, setEditing] = useState<AdminItem | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const endpoint =
      kind === "users"
        ? usersEndpoints.list({ limit: 100 })
        : kind === "departments"
          ? departmentsEndpoints.list({ limit: 100 })
          : templatesEndpoints.list({ limit: 100 });
    endpoint
      .then((result) => setItems(result as AdminItem[]))
      .catch((cause: unknown) =>
        setError(
          cause instanceof Error ? cause.message : "Unable to load data",
        ),
      );
  }, [kind]);

  function replace(item: AdminItem) {
    setItems((current) =>
      current.some((entry) => entry.id === item.id)
        ? current.map((entry) => (entry.id === item.id ? item : entry))
        : [item, ...current],
    );
    setEditing(null);
  }

  async function remove(item: AdminItem) {
    if (!window.confirm(`Delete ${item.name}?`)) return;
    try {
      if (kind === "users") await usersEndpoints.remove(item.id);
      else if (kind === "departments")
        await departmentsEndpoints.remove(item.id);
      else await templatesEndpoints.remove(item.id);
      setItems((current) => current.filter((entry) => entry.id !== item.id));
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : "Unable to delete");
    }
  }

  return (
    <section aria-labelledby="page-title" className="space-y-lg">
      <div>
        <p className="text-eyebrow uppercase text-ink-muted">
          Open Project / Admin
        </p>
        <h1 className="mt-xs text-headline" id="page-title">
          {title}
        </h1>
        <p className="mt-xs max-w-[42rem] text-body-sm text-ink-muted">
          {description}
        </p>
      </div>
      <AdminForm kind={kind} item={editing} onSaved={replace} />
      {error ? (
        <p
          className="border border-error p-sm text-body-sm text-error"
          role="alert"
        >
          {error}
        </p>
      ) : null}
      <Table.Container>
        <Table.Root>
          <Table.Header>
            <Table.Row>
              <Table.Head>Name</Table.Head>
              {kind === "users" ? (
                <>
                  <Table.Head>Email</Table.Head>
                  <Table.Head>Role</Table.Head>
                </>
              ) : null}
              {kind === "templates" ? <Table.Head>Tasks</Table.Head> : null}
              <Table.Head>Actions</Table.Head>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {items.map((item) => (
              <Table.Row key={item.id}>
                <Table.Cell>{item.name}</Table.Cell>
                {kind === "users" ? (
                  <>
                    <Table.Cell>{"email" in item ? item.email : ""}</Table.Cell>
                    <Table.Cell>{"role" in item ? item.role : ""}</Table.Cell>
                  </>
                ) : null}
                {kind === "templates" ? (
                  <Table.Cell>
                    {"tasks" in item ? (item.tasks?.length ?? 0) : 0}
                  </Table.Cell>
                ) : null}
                <Table.Cell>
                  <div className="flex gap-xs">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setEditing(item)}
                    >
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => remove(item)}
                    >
                      Delete
                    </Button>
                  </div>
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Root>
      </Table.Container>
      {!items.length && !error ? (
        <p className="text-body-sm text-ink-muted">No records yet.</p>
      ) : null}
    </section>
  );
}
