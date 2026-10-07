import type { Task, UUID } from "@/api";

export function groupTasks(tasks: Task[]) {
  const compare = (left: Task, right: Task) => left.position - right.position;
  const roots = tasks
    .filter((task) => task.parent_task_id === null)
    .sort(compare);
  const children = new Map<UUID, Task[]>();
  for (const task of tasks) {
    if (!task.parent_task_id) continue;
    const siblings = children.get(task.parent_task_id) ?? [];
    siblings.push(task);
    children.set(task.parent_task_id, siblings);
  }
  for (const siblings of children.values()) siblings.sort(compare);

  const ordered: Task[] = [];
  const included = new Set<UUID>();
  for (const root of roots) {
    ordered.push(root);
    included.add(root.id);
    for (const child of children.get(root.id) ?? []) {
      ordered.push(child);
      included.add(child.id);
    }
  }
  ordered.push(...tasks.filter((task) => !included.has(task.id)).sort(compare));

  const byId = new Map<UUID, Task>(
    tasks.map((task): [UUID, Task] => [task.id, task]),
  );

  return { roots, children, ordered, byId };
}

export function projectKeyPrefix(projectKey: string) {
  return projectKey.match(/^[a-z]{1,3}\d*/i)?.[0] ?? projectKey.slice(0, 3);
}
