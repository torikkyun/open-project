# Kiến trúc Open Project

## Tổng quan

Open Project là ứng dụng quản lý dự án theo mô hình monorepo:

- `web/`: giao diện React, TanStack Start và TanStack Router.
- `api/`: REST API FastAPI, SQLAlchemy bất đồng bộ và Alembic.
- `docker/`: cấu hình PostgreSQL và các dịch vụ chạy cục bộ.
- `docs/schema.dbml`: sơ đồ dữ liệu tương ứng migration Alembic `0005`.

Luồng chính: trình duyệt gọi API tại `/api/v1`; API xác thực phiên, kiểm tra quyền thành viên dự án và đọc/ghi PostgreSQL. Tệp media được API phục vụ tại `/media`.

## Các dịch vụ

| Thành phần | Vai trò | Cấu hình cục bộ |
|---|---|---|
| Web | Giao diện và điều hướng theo file route | Cổng `3000`; URL API mặc định `http://localhost:8000/api/v1` |
| API | Xác thực, nghiệp vụ và REST API | Cổng `8000`; tiền tố `/api/v1` |
| PostgreSQL | Lưu dữ liệu ứng dụng | Khởi chạy qua Docker Compose |
| DB client | Công cụ truy cập DB trong môi trường phát triển | Cổng `4224` |

Môi trường phát triển được định nghĩa trong [`docker/compose.dev.yml`](./docker/compose.dev.yml). Cấu hình kiểm thử hiện chỉ khởi chạy PostgreSQL trong [`docker/compose.test.yml`](./docker/compose.test.yml).

## Backend

Điểm vào là [`api/src/main.py`](./api/src/main.py). File này cấu hình FastAPI, CORS, kiểm tra `Origin` cho request thay đổi dữ liệu, mount thư mục media và gắn router phiên bản 1.

Router tổng hợp tại [`api/src/api/v1/router.py`](./api/src/api/v1/router.py) gồm bốn nhóm:

- `auth`: đăng nhập, làm mới phiên và đăng xuất.
- `users`: thông tin tài khoản, quản lý tài khoản và cập nhật hồ sơ.
- `projects`: dự án và thành viên dự án.
- `tasks`: công việc, sắp xếp thứ tự và bình luận.

Mỗi module thường chứa `router.py`, `schema.py` và `models.py`. Router xử lý endpoint và truy vấn dữ liệu; schema Pydantic xác thực dữ liệu vào/ra; model SQLAlchemy ánh xạ bảng. Kiểm tra quyền dùng chung cho dự án nằm trong [`api/src/modules/projects/service.py`](./api/src/modules/projects/service.py). Session DB bất đồng bộ được cấp qua dependency trong [`api/src/infra/db/session.py`](./api/src/infra/db/session.py).

API hiện cho phép thành viên đọc và cập nhật dữ liệu dự án/công việc. Chủ sở hữu quản lý thành viên và xóa dự án; quản trị viên quản lý tài khoản. Người được giao việc và người báo cáo phải là thành viên đang hoạt động của dự án.

## Frontend

Web dùng React, TanStack Start, TanStack Router, TanStack Query và Tailwind CSS. Vite cấu hình route plugin cùng Nitro trong [`web/vite.config.ts`](./web/vite.config.ts). Route được khai báo trong `web/src/routes/`; [`web/src/routeTree.gen.ts`](./web/src/routeTree.gen.ts) là file sinh tự động, không chỉnh sửa trực tiếp.

Các màn hình chính:

- `/login`: đăng nhập.
- `/`: không gian làm việc và danh sách dự án.
- `/projects/:projectId`: các tab dự án; danh sách và dòng thời gian có nội dung, các tab còn lại hiện là khung giao diện.
- `/admin/users`: quản lý tài khoản dành cho quản trị viên.
- `/settings`: trang cài đặt.

[`web/src/routes/__root.tsx`](./web/src/routes/__root.tsx) cung cấp `QueryClientProvider` và `AuthProvider`. Layout ứng dụng được bảo vệ trong `web/src/routes/_app/route.tsx`. Tính năng dự án nằm dưới `web/src/feat/project/`; các component dùng hook để tải dữ liệu, cập nhật cache và gửi mutation.

[`web/src/api/client.ts`](./web/src/api/client.ts) là lớp HTTP dùng chung: luôn gửi cookie, tạo JSON body khi cần, chuẩn hóa lỗi và thử làm mới phiên một lần sau HTTP 401. [`web/src/api/index.ts`](./web/src/api/index.ts) khai báo các hàm endpoint; kiểu dữ liệu dùng chung nằm trong `web/src/api/contract.ts`.

## Xác thực và quyền truy cập

API phát hành access token và refresh token JWT trong cookie `HttpOnly`. Refresh token chỉ lưu dạng SHA-256 trong bảng `refresh_sessions`; refresh thành công sẽ thu hồi token cũ và cấp token mới. Phát hiện token đã thu hồi sẽ thu hồi các phiên đang hoạt động của người dùng. Logout thu hồi phiên hiện tại.

Khi tải ứng dụng, frontend gọi `/users/me`. Khi API trả 401, client thử `/auth/refresh` rồi gửi lại request một lần. Nếu refresh thất bại, frontend phát sự kiện hết phiên và xóa người dùng khỏi trạng thái xác thực.

Các endpoint cần đăng nhập lấy người dùng hiện tại qua `get_current_user`. API kiểm tra quyền truy cập dự án ở backend; kiểm tra vai trò trên giao diện chỉ phục vụ điều hướng, không thay thế quyền kiểm tra của API. CORS cho phép cookie với các origin đã cấu hình.

## Dữ liệu

Các model SQLAlchemy nằm trong `api/src/modules/*/models.py`. PostgreSQL lưu các thực thể:

- `users`: tài khoản, vai trò và avatar.
- `projects`: dự án, chủ sở hữu và bộ đếm số công việc.
- `project_members`: quan hệ thành viên, duy nhất theo cặp dự án/người dùng.
- `tasks`: công việc và tối đa một cấp subtask; số thứ tự duy nhất trong từng dự án.
- `task_comments`: bình luận của công việc.
- `refresh_sessions`: phiên refresh có thời hạn và trạng thái thu hồi.

Khóa chính dùng UUID. Ràng buộc khóa ngoại và xóa dây chuyền được định nghĩa trong model và migration. Khi tạo công việc, API khóa bản ghi dự án để cấp số thứ tự an toàn trước khi lưu.

Migration là nguồn thay đổi schema: `api/alembic/versions/`. Kết nối và metadata Alembic được thiết lập trong `api/alembic/env.py`. Sơ đồ DBML là bản mô tả schema tại revision `0005_task_table_fields`; cập nhật sơ đồ khi thay đổi schema.

Avatar chấp nhận JPEG, PNG, WebP hoặc GIF, giới hạn 5 MB và lưu dưới `media/avatars/`. API phục vụ file qua `/media`; chỉ xóa avatar cũ nếu URL trỏ đến file local trong thư mục avatar.

## Cấu hình và lệnh phát triển

API đọc cấu hình từ biến môi trường hoặc `api/.env`; mẫu nằm trong [`api/.env.example`](./api/.env.example). Cần cấu hình `DATABASE_URL` và `AUTH_SECRET_KEY` (ít nhất 32 ký tự khi tạo token). Web đọc `VITE_API_BASE_URL` từ `web/.env`; mẫu nằm trong [`web/.env.example`](./web/.env.example).

Tạo hai file `.env` từ mẫu trước khi chạy Docker Compose vì cả dịch vụ API và web đều khai báo `env_file`.

```sh
make docker-dev
make migration-up
make seed
```

Lệnh hữu ích:

```sh
cd api
uv run alembic upgrade head
uv run ruff check src alembic

cd web
pnpm build
```

`pnpm build` cũng cập nhật route tree sinh tự động sau khi thêm hoặc đổi route.

## Khi thay đổi kiến trúc

- Khi đổi model dữ liệu, tạo migration Alembic và cập nhật `docs/schema.dbml`.
- Khi đổi API, đồng bộ kiểu dữ liệu và hàm gọi trong `web/src/api/`.
- Khi thêm route, chỉnh file route tương ứng rồi chạy build web để sinh lại route tree.
- Giữ kiểm tra quyền ở API; không dựa riêng vào trạng thái hoặc điều hướng của frontend.