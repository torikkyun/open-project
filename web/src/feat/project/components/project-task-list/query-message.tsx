export function QueryMessage({
  error,
  pending,
}: {
  error: Error | null;
  pending: boolean;
}) {
  if (error) {
    return (
      <p className="py-8 text-center text-sm text-destructive" role="alert">
        {error.message}
      </p>
    );
  }
  if (pending) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        Đang tải công việc...
      </p>
    );
  }
  return null;
}
