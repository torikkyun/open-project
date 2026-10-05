# Lưu ý dự án

- Trang tài khoản dùng route `/account`, cập nhật `full_name` và avatar; email chỉ đọc.
- `PATCH /users/me` dùng multipart. Avatar mới phải giới hạn loại file và 5 MB.
- Chỉ xóa avatar cũ khi URL trỏ tới file local dưới `/media/avatars/`; không xóa URL bên ngoài.
- Không thêm dependency nếu helper hoặc component hiện có đã đủ.
- Sau thay đổi route, chạy `pnpm build` trong `web` để regenerate `src/routeTree.gen.ts`.
- Validation API:
  - `cd api`
  - `uv run alembic upgrade head`
  - `uv run ruff check src alembic`
- Validation frontend:
  - `cd web`
  - `pnpm build`
- Auth flow cần giữ: cookie HttpOnly, refresh khi reload/401, revoke khi logout hoặc reuse refresh cookie, CSRF cho request mutate cross-origin.
