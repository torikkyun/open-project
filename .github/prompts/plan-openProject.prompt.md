## Plan: MVP Open Project

Mục tiêu: hoàn thiện MVP quản lý dự án và công việc cho khoảng 20 người, 3 phòng ban, responsive mobile. Tận dụng lõi NestJS/Prisma hiện có; ưu tiên hoàn thiện API contract, quyền truy cập và trải nghiệm web List/Kanban/Gantt. File MVP lưu trên local volume qua UPLOAD_PATH. Thông báo gần realtime dùng polling 30 giây, chưa mở rộng WebSocket.

**Steps**

### Phase 0: Baseline và hợp đồng dữ liệu

1. Kiểm tra baseline bằng `pnpm check-types`, `pnpm lint`, `pnpm build`, kiểm tra migration/seed và test hiện có. Ghi nhận lỗi nền trước khi thay đổi.
2. Đối chiếu API hiện tại trong `apps/api/src/features/auth`, `projects`, `tasks`, `users-departments` với Product/requirements; chuẩn hóa response, pagination, error shape và date/Decimal serialization để web dùng ổn định.
3. Chốt route map và DTO contract cho auth, dashboard, projects, tasks, comments, attachments/documents, notifications, templates, users/departments và reports. Tạo type dùng chung phía web từ contract hiện có hoặc một lớp mapping rõ ràng; không đưa logic nghiệp vụ vào route component.

### Phase 1: Backend nền tảng và quyền

4. Hoàn thiện policy truy cập theo project membership trong service/guard dùng chung. Admin và Project Manager được quản lý project; Member chỉ cập nhật task được giao; Guest bị giới hạn theo canView/canComment/canUpload và không được sửa task, status hoặc progress. Kiểm tra cả object-level authorization, không chỉ role guard.
5. Rà soát Prisma schema và migration cho task history, SLA/overdue, milestone, custom fields, attachments và notification. Chỉ thêm migration cho phần còn thiếu; giữ soft-delete và index theo convention hiện có. Bổ sung seed tối thiểu cho 4 role, project, task hierarchy, dependency, review và overdue cases.
6. Tạo hoặc hoàn thiện API comments/replies và attachments/documents. Dùng multipart upload vào `UPLOAD_PATH`, giới hạn size/mime type, sinh tên lưu trữ an toàn, download qua endpoint có authorization; hỗ trợ attachment ở project/task/comment theo schema.
7. Tạo notification service dùng chung cho task assignment, status/progress update, comment, review, project membership và overdue. Lưu notification trong DB; thêm list/unread count/mark-read endpoints. Web polling 30 giây; không triển khai WebSocket trong MVP.
8. Thêm dashboard/statistics và basic report endpoints: project/task totals, progress, backlog, overdue/SLA, tasks assigned, tasks needing review, estimated-vs-actual hours; áp dụng cùng scope quyền của người dùng. Export basic CSV/XLSX hoặc định dạng được package hiện tại hỗ trợ, giới hạn ở dữ liệu báo cáo MVP.
9. Hoàn thiện nghiệp vụ task: validation task date trong project date, parent-child cycle prevention, progress aggregation, review-required transition, actual hours/volume validation, dependency validation và transaction khi cập nhật assignees/status. Khi đổi lịch task cha, xử lý FS child adjustment theo BR-06; ghi history cho thay đổi quan trọng.
10. Viết unit/service tests và API e2e tests cho auth, authorization matrix, project/task CRUD, hierarchy, review, dependency/date rules, comments, upload authorization, notifications và dashboard calculations. Chạy test slice sau mỗi module.

### Phase 2: Web data layer và application shell

11. Hoàn thiện `apps/web/src/api/client.ts`: base URL, credentials cookie, typed request helpers, FormData upload, lỗi chuẩn hóa, auth refresh/logout behavior và query invalidation conventions.
12. Thêm endpoint clients trong `apps/web/src/api/endpoints` cho auth, dashboard, projects, tasks, comments, documents, notifications, users/departments, templates và reports. Định nghĩa query keys, loading/error/empty states và optimistic update chỉ cho hành vi đã có rollback.
13. Mở rộng TanStack Router trong `apps/web/src/routes` và cập nhật generated route tree theo workflow framework: login, dashboard, projects list, project detail, task detail/drawer, admin users/departments/templates. Giữ `__root.tsx` làm shell; thêm navigation, session guard và role-aware route/action visibility.
14. Tạo feature boundaries trong `apps/web/src/features`: auth, dashboard, projects, tasks, collaboration, documents, notifications, admin. Tái sử dụng component UI hiện có, Table/Kanban/Tabs/Dialog/Drawer và indicator components; không tạo design system song song.

### Phase 3: MVP user workflows

15. Xây dashboard: scope filter toàn hệ thống/dự án/cá nhân theo quyền, KPI totals, progress, backlog, overdue, SLA, assigned tasks, review queue, workload và notification preview. Tất cả số liệu lấy API, có skeleton/error/empty state.
16. Xây projects list: search cơ bản, filters status/manager/date, pagination, project summary và action create/update/archive theo quyền. Xây create/edit form có template selector và member assignment.
17. Xây project detail: summary, member management, milestone/document areas và tab navigation. Member add/remove/role/Guest permissions phải gọi API policy đã có.
18. Xây task List view: hierarchical rows, expand/collapse, filters/search, inline progress/status where allowed, estimated/actual/SLA columns, overdue and review indicators, task create/edit drawer, assignee and parent selectors.
19. Xây Kanban view: columns for todo/in_progress/review/done/canceled, drag/drop status updates only for permitted users, review transition enforcement, accessible keyboard alternative, pending/error rollback and invalid Guest actions hidden/blocked.
20. Xây Gantt view: day/week/month zoom, task bars, progress, milestones, dependency lines, filters and responsive horizontal scrolling. PM/Admin can drag task dates; validate project bounds and invoke dependency adjustment API. Member/Guest view only.
21. Xây task collaboration: comments/replies, attachment upload/download, task history, document list/search/download, notification center with unread state and 30-second polling. Show authorization-specific controls and clear upload failures.
22. Xây admin screens: users, departments, roles, templates; template CRUD must support task structure reuse during project creation. Custom status/unit/custom fields remain minimal configuration surface only where current schema/API supports it.
23. Thêm export controls trên report/dashboard với permission checks, progress state and download error handling.

### Phase 4: Hardening, accessibility và vận hành

24. Add responsive behavior for mobile: compact navigation, drawer forms, horizontal Gantt scroll, touch-safe controls, no clipped text or overlapping actions. Preserve existing IBM Plex Sans/Tailwind token conventions; avoid changing unrelated UI components.
25. Add accessibility checks: labels, focus management for Dialog/Drawer, keyboard Kanban alternative, table semantics, status text not color-only, upload errors and live notification updates.
26. Add frontend tests for route guards, permission visibility, project/task forms, List/Kanban state transitions, Gantt date editing, polling cleanup and upload/download states. Add Playwright smoke flows for login, create project, create/assign/update/review task, three views, comment/upload and dashboard.
27. Run `pnpm check-types`, `pnpm lint`, `pnpm build`, backend unit/e2e tests, frontend tests and Docker compose test environment. Verify migration from clean database, seed login, upload volume persistence, cookie auth, mobile viewport and permission matrix manually.
28. Update `README.md`, `apps/api/README.md`, `.env` documentation and API/architecture docs where implementation differs. Document local development commands, Docker services, UPLOAD_PATH, polling interval, seed credentials policy and MVP exclusions.

**Relevant files**

- `ARCHITECTURE.md`, `PRODUCT.md`, `docs/v1/1-1-requirements-analysis.md`, `docs/v1/4-1-api-contract.md` — source of product scope, rules, actor permissions and API contracts; update only when implementation decisions change documented behavior.
- `apps/api/prisma/schema.prisma`, `apps/api/prisma/migrations/`, `apps/api/prisma/seed.ts` — data model, migrations and realistic MVP fixtures.
- `apps/api/src/main.ts`, `apps/api/src/app.module.ts`, `apps/api/src/common/` — global versioning, validation, guards, decorators, filters and shared authorization policy.
- `apps/api/src/features/auth/` — session/JWT cookie behavior and current-user context.
- `apps/api/src/features/projects/` and `apps/api/src/features/tasks/` — existing CRUD/service patterns; extend services for object-level policy, hierarchy, review, dependency, history and notifications.
- `apps/api/src/infra/cache/`, `apps/api/src/configs/` — configuration boundary; cache only if existing infrastructure supports it, no Redis dependency required for MVP polling.
- `apps/web/src/api/client.ts`, `apps/web/src/api/endpoints/` — typed HTTP and endpoint layer.
- `apps/web/src/router.tsx`, `apps/web/src/routes/`, `apps/web/src/routeTree.gen.ts` — authenticated route graph and shell integration.
- `apps/web/src/features/`, `apps/web/src/components/ui/`, `apps/web/src/components/shared/` — feature pages and existing UI primitives.
- `docker/compose.dev.yml`, `docker/compose.test.yml`, root `package.json`, app package manifests — local services and verification scripts.

**Verification**

1. Baseline and final gates: `pnpm check-types`, `pnpm lint`, `pnpm build`; capture and separate pre-existing failures from regressions.
2. Backend unit tests: authorization matrix, date bounds, parent cycles, progress calculation, review-required transitions, dependency scheduling, SLA overdue and report aggregation.
3. Backend e2e tests: cookie auth, project/task endpoints, Guest view/comment/upload permissions, file path isolation, notification generation and pagination/filter contracts.
4. Frontend tests: route/session guards, role-aware controls, forms, query loading/error/empty states, Kanban rollback, Gantt drag validation and notification polling cleanup.
5. Playwright smoke: login as Admin/PM/Member/Guest; create project from template; create hierarchy and assign task; update progress/actual hours; review approve/reject; inspect List/Kanban/Gantt; comment/upload/download; verify dashboard and unread notifications.
6. Manual mobile checks at narrow viewport: navigation, forms, task drawer, Kanban horizontal behavior, Gantt scroll/drag rules and no text/action overlap.
7. Clean Docker database migration plus seed; verify local upload volume survives API restart and unauthorized users cannot read files or mutate records.

**Decisions**

- MVP scope follows `PRODUCT.md`: Calendar, advanced reminders, Change Request, advanced reports, global advanced search/filter and backup/restore are excluded.
- File storage: local filesystem volume configured by `UPLOAD_PATH`; storage abstraction may be kept small so S3 can be added later.
- Realtime notifications: DB-backed notifications plus 30-second client polling; WebSocket is post-MVP.
- Guest permissions are project-scoped flags and enforced server-side on every resource operation; hiding UI is supplementary only.
- Report export is basic and permission-scoped; advanced analytics excluded.
- Existing feature-based NestJS/Prisma and TanStack Router/UI patterns remain authoritative. No broad refactor or unrelated bug cleanup.

**Further Considerations**

1. Confirm whether XLSX is mandatory for MVP export. Recommendation: ship CSV first if no existing XLSX dependency; add XLSX only if business acceptance requires spreadsheet formatting.
2. Confirm whether task “khối lượng thực tế” needs a separate numeric/unit field beyond `actualHours`. Recommendation: add explicit actual quantity/unit only if acceptance tests require it; otherwise document actual hours plus progress as MVP representation.
3. Confirm review-required as a per-task setting or global rule. Recommendation: add a task-level boolean only if current schema lacks it; default to global review flow for the first MVP slice.
