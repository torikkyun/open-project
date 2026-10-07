# Hướng dẫn dự án

Chuẩn giao diện nằm trong [`DESIGN.md`](./DESIGN.md). Kiến trúc nằm trong
[`ARCHITECTURE.md`](./ARCHITECTURE.md).

## Cài đặt

```sh
cd web
pnpm install

cd ../api
uv sync
```

Tạo `web/.env` và `api/.env` từ các file `.env.example` tương ứng trước khi
chạy Docker Compose.

## Chạy môi trường phát triển

```sh
make docker-dev
make migration-up
make seed

cd web
pnpm dev
```

Web chạy ở cổng `3000` và gọi API ở `http://localhost:8000/api/v1` theo mặc
định của `web/.env`.

## Kiểm tra trước khi commit

Lần bàn giao gần nhất chỉ giao code, chưa chạy các lệnh dưới đây. Chạy lại
trước khi commit:

```sh
cd web
pnpm build

cd ../api
uv run ruff check src alembic
```

Kiểm tra nhanh quy tắc hạn chót công việc con (không cần DB):

```powershell
cd api
@'
from datetime import datetime, timezone
from fastapi import HTTPException
from src.modules.tasks.router import ensure_due_within_parent as f

day = lambda value: datetime(2026, 1, value, tzinfo=timezone.utc)
f(day(10), day(9))
f(None, day(9))
try:
    f(day(10), day(11))
except HTTPException as error:
    assert error.status_code == 422
else:
    raise AssertionError("phải chặn hạn chót công việc con vượt quá cha")
print("ok")
'@ | uv run python -
```

## Kiểm tra giao diện thủ công

Mở lần lượt các trang dưới đây:

1. Gõ liên tục vào ô "Tìm công việc" và ô tiêu đề công việc; bảng không được
   giật, không render lại toàn bộ hàng mỗi ký tự (xem React Profiler).
2. Tab `Dòng thời gian`, thang `Tuần`: mỗi ngày thứ Hai hiện `dd/MM` để biết
   tuần thuộc tháng nào.
3. Công việc con có hạn chót lớn hơn công việc cha: API trả 422 và giao diện
   hiện thông báo; ô hạn chót của công việc con chặn chọn ngày vượt quá cha.
4. Rút ngắn hạn chót công việc cha xuống trước hạn của công việc con: API trả
   422.
5. Tab `Bảng`: ba cột trạng thái, kéo thả đổi trạng thái, lọc theo từ khóa và
   người thực hiện.
6. `/settings`: hai khối "Thông tin cá nhân" và "Cài đặt ứng dụng"; đổi "Giao
   diện" sang Tối thì cả trang đổi màu ngay, tải lại vẫn giữ; không còn thanh
   mục giả ở bên trái.
7. `/admin/users`: panel cao bằng khung nhìn, bảng cuộn bên trong, tiêu đề
   `text-xl`, đang tải và rỗng nằm trong bảng.

## Ghi chú

- Không thêm dependency mới và không có migration mới trong lần bàn giao này.
- Route tree `web/src/routeTree.gen.ts` là file sinh tự động; `pnpm build` cập
  nhật lại file này.
