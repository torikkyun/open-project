import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/_app/")({
  component: App,
})

function App() {
  return (
    <main className="min-h-[calc(100svh-3.75rem)] bg-muted/30 p-4 sm:p-6">
      <div className="mx-auto max-w-7xl rounded-lg border bg-background p-8">
        <h1 className="text-xl font-semibold">Không gian làm việc</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Chọn dự án ở thanh bên hoặc tạo dự án mới.
        </p>
      </div>
    </main>
  )
}
