# Copilot Instructions — Frontend (apps/web)

> Quy tắc bắt buộc khi sinh code frontend. KHÔNG tự ý thêm library, pattern, file ngoài yêu cầu.

## Stack

- TanStack Start (SSR, file-based routing)
- TanStack Router (`createFileRoute`, `createRootRoute`)
- React 19+ (function components, hooks only)
- Tailwind CSS v4 (`@import "tailwindcss"` + `@theme` block)
- @base-ui/react — headless UI primitives
- TypeScript strict

## KHÔNG được làm

1. KHÔNG dùng shadcn/ui, Radix UI, Headless UI, Chakra, MUI — project dùng @base-ui/react
2. KHÔNG dùng `clsx`, `tailwind-merge`, `cva` — project có custom `cn()` riêng (xem bên dưới)
3. KHÔNG tự tạo CSS file mới — styling bằng Tailwind utility classes
4. KHÔNG dùng inline `style={{}}` trừ khi cần dynamic value (transform, width %)
5. KHÔNG sửa `routeTree.gen.ts` — file này tự sinh bởi TanStack Router
6. KHÔNG dùng `useEffect` cho data fetching — dùng TanStack Query hoặc route loader
7. KHÔNG import trực tiếp từ `@base-ui/react` trong feature code — import từ `components/ui/`
8. KHÔNG dùng `React.FC`, `React.forwardRef` trừ khi Base UI yêu cầu
9. KHÔNG tự install thêm UI library

## Cấu trúc thư mục

```
src/
├── api/                # Giao tiếp backend
│   ├── client.ts       # Fetch/Axios instance, interceptors, base URL
│   ├── endpoints/      # Chia theo domain: auth.api.ts, project.api.ts
│   └── index.ts
│
├── routes/             # TanStack Router (file-based)
│   ├── __root.tsx      # Root layout, global providers, head meta
│   ├── _layout.tsx     # Shared layout (sidebar, header)
│   └── [feature]/      # Nested routes
│
├── features/           # Feature modules (theo nghiệp vụ)
│   └── [feature]/
│       ├── components/
│       ├── hooks/
│       └── types.ts
│
├── components/
│   ├── ui/             # Base UI wrappers (Button, Input, Dialog, ...)
│   └── shared/         # Composed components (FormField, DateField, ...)
│
├── hooks/              # Global custom hooks
├── lib/                # Utils, constants, validators
├── providers/          # Context providers (Query, Theme, Auth)
├── store/              # Zustand stores
├── types/              # Global TypeScript types
└── assets/styles/      # globals.css (chứa @theme tokens)
```

## Custom `cn()` — KHÔNG dùng clsx/twMerge

Project có `cn()` riêng tại `components/ui/cn.ts`. Nó hỗ trợ Base UI **state callback functions**:

```tsx
// String-only (giống clsx)
cn("flex items-center", isActive && "bg-primary", className);

// Với state callback (dành cho Base UI render props)
cn(
  "base-classes",
  (state) => {
    if (state.disabled) return "cursor-not-allowed";
    if (state.checked) return "bg-primary";
    return "bg-canvas";
  },
  className,
);
```

## Styling — Dùng semantic tokens từ globals.css

Mọi project định nghĩa design tokens trong `globals.css` qua `@theme` block. Khi code:

- Dùng **semantic token names** đã define trong `@theme` — KHÔNG hardcode hex/rgb
- Đọc `globals.css` để biết token names trước khi viết className
- KHÔNG tự đặt tên token mới, KHÔNG dùng Tailwind default colors (`gray-100`, `blue-500`, ...)

```tsx
// Đúng — dùng token từ @theme
className = "bg-surface-1 text-ink border-hairline";

// Sai — hardcode hoặc dùng Tailwind default
className = "bg-[#f4f4f4] text-gray-900 border-gray-200";
```

## Component Pattern — Compound Components

UI components wrap Base UI bằng **compound pattern**, export qua namespace object:

```tsx
// Định nghĩa — mỗi sub-component là named function
function DialogRoot(props: DialogRootProps) { ... }
function DialogTitle(props: DialogTitleProps) { ... }
function DialogClose(props: DialogCloseProps) { ... }

// Export namespace
export const Dialog = {
  Root: DialogRoot,
  Title: DialogTitle,
  Close: DialogClose,
};
```

Quy tắc:

- Mọi sub-component export type props: `export type DialogRootProps = ComponentProps<typeof BaseDialog.Root>`
- Mọi component nhận `className` prop, merge bằng `cn()`
- Named function cho components, KHÔNG arrow function
- File UI component đặt trong `components/ui/`, export qua `components/ui/index.ts`

Sử dụng:

```tsx
// Feature code import từ components/ui, KHÔNG từ @base-ui/react
import { Dialog, Button } from "@/components/ui";

<Dialog.Root>
  <Dialog.Trigger>Open</Dialog.Trigger>
  <Dialog.Content heading="Title">
    <Button>Action</Button>
  </Dialog.Content>
</Dialog.Root>;
```

## Shared Components (components/shared/)

Composed components wrap UI primitives cho patterns lặp lại (forms, fields):

```tsx
<FormField label="Project name" error={errors.name} required>
  <Input placeholder="..." />
</FormField>
```

- Props pattern chung: `{ label, description?, error?, required?, className?, children }`
- Export cả component lẫn props type từ `components/shared/index.ts`

## Route Conventions (TanStack Start)

```tsx
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/")({
  component: DashboardPage,
});

function DashboardPage() {
  return <div>...</div>;
}
```

```tsx
// Root route — CSS import dùng ?url
import appCss from "../assets/styles/globals.css?url";

export const Route = createRootRoute({
  head: () => ({
    meta: [...],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  component: RootComponent,
});
```

- Layout dùng `_layout.tsx` với `<Outlet />`
- KHÔNG dùng `React.lazy()` — TanStack Router handle code splitting
- Data fetching: `loader` trong route hoặc TanStack Query hooks

## Feature Module

```
src/features/projects/
├── components/
│   ├── project-list.tsx
│   └── create-project-dialog.tsx
├── hooks/
│   ├── use-projects.ts
│   └── use-create-project.ts
└── types.ts
```

- KHÔNG tạo index.ts trong feature — import trực tiếp từ file
- Feature component import UI từ `@/components/ui` hoặc `@/components/shared`

## API Layer

```tsx
// api/endpoints/projects.api.ts
export async function getProjects(params: GetProjectsParams) {
  return client.get<ProjectListResponse>("/v1/projects", { params });
}
```

- Mỗi domain 1 file: `auth.api.ts`, `projects.api.ts`, `tasks.api.ts`
- Export functions, KHÔNG export class
- URL prefix: `/v1/` (match backend versioning)

## Naming

```
Components:     PascalCase         — ProjectList, CreateTaskDialog
Files:          kebab-case         — project-list.tsx, use-projects.ts
Hooks:          camelCase          — useProjects, useCreateTask
Types/Props:    PascalCase         — ProjectListProps, CreateTaskBody
Route files:    lowercase          — dashboard/index.tsx, login.tsx
```
