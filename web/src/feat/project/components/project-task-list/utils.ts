export function dateInputValue(value: string | null) {
  return value ? value.slice(0, 10) : "";
}

export function dateValue(value: string) {
  return value ? new Date(`${value}T12:00:00.000Z`).toISOString() : null;
}

export function moveTask<T>(
  items: T[],
  sourceIndex: number,
  targetIndex: number,
) {
  const next = [...items];
  const [moved] = next.splice(sourceIndex, 1);
  if (moved !== undefined) next.splice(targetIndex, 0, moved);
  return next;
}
