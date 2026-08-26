import type { ReactNode } from "react";

interface StorySectionProps {
  id: string;
  title: string;
  description: string;
  children: ReactNode;
}

export function StorySection({
  id,
  title,
  description,
  children,
}: StorySectionProps) {
  return (
    <section id={id} className="border-t border-hairline py-10">
      <div className="grid gap-8 lg:grid-cols-[240px_1fr]">
        <header>
          <h2 className="text-card-title text-ink">{title}</h2>
          <p className="mt-2 text-body-sm text-ink-muted">{description}</p>
        </header>
        <div className="flex min-w-0 flex-wrap items-start gap-6">
          {children}
        </div>
      </div>
    </section>
  );
}
