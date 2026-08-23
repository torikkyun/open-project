export type ClassNamePart<T> =
  | string
  | ((state: T) => string | undefined)
  | false
  | null
  | undefined;

export function cn<T = unknown>(
  ...parts: Array<ClassNamePart<T>>
): string | ((state: T) => string | undefined) {
  const strings: string[] = [];
  const fns: Array<(state: T) => string | undefined> = [];

  for (const part of parts) {
    if (!part) continue;
    if (typeof part === "function") fns.push(part);
    else strings.push(part);
  }

  const base = strings.join(" ");
  if (fns.length === 0) return base;

  return (state: T) => {
    const dynamic = fns
      .map((fn) => fn(state))
      .filter(Boolean)
      .join(" ");
    return [base, dynamic].filter(Boolean).join(" ");
  };
}
