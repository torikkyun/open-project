export function PagePlaceholder({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <section aria-labelledby="page-title" className="space-y-lg">
      <div>
        <p className="text-eyebrow uppercase text-ink-muted">Open Project</p>
        <h1 className="mt-xs text-headline" id="page-title">
          {title}
        </h1>
        <p className="mt-xs max-w-[42rem] text-body-sm text-ink-muted">
          {description}
        </p>
      </div>
      <div className="border border-dashed border-hairline-strong bg-canvas p-xl">
        <p className="text-body-sm text-ink-muted">
          Data view ready for API integration.
        </p>
      </div>
    </section>
  );
}
